import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Like, Repository } from 'typeorm';
import { Coupon } from '../events/entities/coupon.entity';
import { EventEntity } from 'src/events/entities/events.entity';
import { User } from 'src/users/users.entity';
import { ConfigService } from '@nestjs/config';
import SSLCommerzPayment from 'sslcommerz-lts';
import { InitiatePaymentDTO } from './dto/payment.dto';
import { PaginationPaymentDto } from './dto/pagination-payment.dto';
import { PaginationResponseDto } from 'src/common/dto/pagination-response.dto';
import { PaymentResponseDTO } from './dto/payment-response.dto';
import { Booking } from 'src/bookings/entities/bookings.entity';
import { Invoice } from 'src/documents/entities/invoices.entity';
import { Ticket } from 'src/documents/entities/tickets.entity';
import { PdfService } from 'src/common/pdf/pdf.service';
import { MailerService } from '@nestjs-modules/mailer';
import axios from 'axios';
import { EventsService } from 'src/events/events.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Booking) private bookingsRepo: Repository<Booking>,
    @InjectRepository(Coupon) private couponRepo: Repository<Coupon>,
    @InjectRepository(EventEntity) private eventRepo: Repository<EventEntity>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
    private readonly config: ConfigService,
    private readonly pdfService: PdfService,
    private readonly mailerService: MailerService,
    private readonly eventsService: EventsService,
  ) {}

  private get sslcz() {
    const store_id = this.config.get<string>('SSLCZ_STORE_ID');
    const store_passwd = this.config.get<string>('SSLCZ_STORE_PASS');
    const is_live = this.config.get<string>('SSLCZ_IS_LIVE') === 'true';
    return new SSLCommerzPayment(store_id, store_passwd, is_live);
  }

  private async applyCoupon(code?: string) {
    if (!code) return { discountPercent: 0, coupon: null as Coupon | null };
    const now = new Date();
    const coupon = await this.couponRepo.findOne({
      where: { code, active: true },
    });
    if (!coupon) throw new BadRequestException('Invalid coupon code');

    if (now < new Date(coupon.validFrom) || now > new Date(coupon.validTo)) {
      throw new BadRequestException('Coupon expired or not yet valid');
    }

    return { discountPercent: coupon.discountPercent, coupon };
  }

  private calcTotal(unitPrice: number, qty: number, discountPercent: number) {
    const gross = unitPrice * qty;
    const discount = (gross * discountPercent) / 100;
    const total = Math.max(0, gross - discount);
    return { gross, discount, total };
  }

  async initiate(
    bookingId: number,
    dto: InitiatePaymentDTO,
  ): Promise<{ gatewayUrl: string; tranId: string }> {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
      relations: ['event', 'user'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'PENDING') {
      throw new BadRequestException(
        'Only PENDING bookings can initiate payment',
      );
    }

    const now = new Date();
    const createdAt = new Date(booking.createdAt);
    const ageInMs = now.getTime() - createdAt.getTime();

    if (ageInMs > 24 * 60 * 60 * 1000) {
      throw new BadRequestException(
        'Pending booking expired (24h passed). Please create a new booking.',
      );
    }

    if (new Date(booking.event.date) < now) {
      throw new BadRequestException(
        'Event date has already expired! You cannot book seats for this past event.',
      );
    }

    const { discountPercent, coupon } = await this.applyCoupon(dto.couponCode);

    const { total } = this.calcTotal(
      Number(booking.unitPrice),
      booking.quantity,
      discountPercent,
    );

    const dateString = now.toISOString().slice(0, 10).replace(/-/g, '');
    const tranId = `EVT${booking.event.id}${Math.floor(Math.random() * 9999)}${dateString}`;

    const payment = this.paymentRepo.create({
      bookingId: booking.id,
      event: booking.event,
      user: booking.user,
      eventTitle: booking.eventTitle,
      quantity: booking.quantity,
      amount: total.toFixed(2),
      tranId,
      status: 'INITIATED',
      currency: 'BDT',
      cusName: booking.user.fullname,
      cusEmail: booking.user.email,
      gateway: 'SSLCommerz',
      couponCode: coupon?.code || null,
      couponDiscount: discountPercent || 0,
    });
    await this.paymentRepo.save(payment);

    const backendUrl =
      this.config.get<string>('BACKEND_URL') || 'http://localhost:7000';

    // ✅ FIXED ALL TYPESCRIPT & PROPERTY ERRORS
    const data = {
      total_amount: Number(total.toFixed(2)),
      currency: 'BDT',
      tran_id: tranId,
      success_url: `${backendUrl}/payments/success`,
      fail_url: `${backendUrl}/payments/fail`,
      cancel_url: `${backendUrl}/payments/cancel`,
      ipn_url: `${backendUrl}/payments/ipn`,
      cus_name: booking.user.fullname || 'Customer Name',
      cus_email: booking.user.email,
      cus_add1: 'Dhaka',
      cus_city: 'Dhaka',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: '01700000000',
      shipping_method: 'NO',
      product_name: booking.event?.title || 'Event Ticket',
      product_category: 'Event Ticket',
      product_profile: 'general',
    };

    const apiResponse = await this.sslcz.init(data);
    const gatewayUrl = apiResponse?.GatewayPageURL;
    if (!gatewayUrl) throw new BadRequestException('Failed to get payment URL');

    await this.paymentRepo.update(
      { id: payment.id },
      { method: dto.method || 'Unspecified' },
    );

    return { gatewayUrl, tranId };
  }

  async onSuccess(payload: any) {
    const { val_id, tran_id } = payload || {};
    if (!tran_id) throw new BadRequestException('Missing tran_id');

    const payment = await this.paymentRepo.findOne({
      where: { tranId: tran_id },
      relations: ['user', 'event'],
    });
    if (!payment) throw new NotFoundException('Payment not found');

    // ✅ Idempotency check: if already SUCCESS, return early
    if (payment.status === 'SUCCESS') {
      return {
        message: 'Payment already processed successfully',
        tranId: tran_id,
        valId: payment.valId,
      };
    }

    const res = await this.sslcz.validate({ val_id });
    if (!res || (res.status !== 'VALID' && res.status !== 'VALIDATED')) {
      throw new BadRequestException('Payment not validated by SSLCommerz');
    }

    const booking = await this.bookingsRepo.findOne({
      where: { id: payment.bookingId },
      relations: ['user', 'event'],
    });
    if (!booking) throw new NotFoundException('Pending booking not found');

    payment.status = 'SUCCESS';
    payment.valId = val_id;
    payment.method = res.card_type || payment.method;
    await this.paymentRepo.save(payment);

    await this.bookingsRepo.update(
      { id: booking.id },
      {
        status: 'ACTIVE',
        seatsBooked: booking.quantity,
        totalPaid: payment.amount.toString(),
        payment,
      },
    );

    const currentRev = Number(payment.event.totalRevenue || '0');
    await this.eventRepo.update(
      { id: payment.event.id },
      { totalRevenue: (currentRev + Number(payment.amount)).toFixed(2) },
    );

    const currentDate = new Date();
    const dateString = `${String(currentDate.getDate()).padStart(2, '0')}${String(
      currentDate.getMonth() + 1,
    ).padStart(2, '0')}${currentDate.getFullYear()}`;

    const randomNum = Math.floor(Math.random() * 999999);
    const invoiceNo = `INV${payment.id}-${dateString}${randomNum}`;
    const ticketNo = `TKT${payment.id}-${dateString}${randomNum}`;

    const invoiceBuffer = await this.pdfService.generateInvoiceBuffer({
      id: payment.id,
      customer: payment.user.fullname,
      amount: Number(payment.amount),
      billTo: `${payment.user.fullname} <${payment.user.email}>`,
      billFrom: 'Event Buddy',
      date: new Date().toISOString().split('T')[0],
      items: [
        {
          name: payment.event.title,
          qty: payment.quantity,
          price: payment.event.ticketPrice,
          total: payment.amount,
        },
      ],
      invoiceNo,
    });

    const imageUrl =
      payment.event.imageUrl ??
      (await this.eventsService.getEventImage(payment.event.id));

    const ticketBuffer = await this.pdfService.generateTicketBuffer(
      {
        id: payment.event.id,
        title: payment.event.title,
        date: new Date(payment.event.date).toISOString().split('T')[0],
        location: payment.event.location,
        price: Number(payment.amount),
        imageUrl,
        ticketNo,
        qty: payment.quantity,
      },
      {
        fullname: payment.user.fullname,
        email: payment.user.email,
      },
    );

    const invoiceUploadUrl = await this.pdfService.uploadInvoiceToCloudinary(
      invoiceBuffer,
      payment.id,
      dateString,
      randomNum,
    );

    const ticketUploadUrl = await this.pdfService.uploadTicketToCloudinary(
      ticketBuffer,
      payment.id,
      dateString,
      randomNum,
    );

    await this.invoiceRepo.save({
      user: payment.user,
      payment,
      url: invoiceUploadUrl,
    });

    await this.ticketRepo.save({
      user: payment.user,
      event: payment.event,
      url: ticketUploadUrl,
    });

    try {
      await this.mailerService.sendMail({
        to: payment.user.email,
        subject: `${payment.event.title} Payment Confirmation`,
        html: `<p>Thank you for your payment! 🎉</p><p>Attached is your event invoice.</p>`,
        attachments: [
          {
            filename: `INV${payment.id}-${dateString}${randomNum}.pdf`,
            content: invoiceBuffer,
          },
        ],
      });

      await this.mailerService.sendMail({
        to: payment.user.email,
        subject: `Download ${payment.event.title} Ticket`,
        html: `<p>Thank you for your purchase! 🎉</p><p>Attached is your event ticket.</p>`,
        attachments: [
          {
            filename: `TKT${payment.id}-${dateString}${randomNum}.pdf`,
            content: ticketBuffer,
          },
        ],
      });
    } catch (err) {
      console.error('Email sending failed:', err);
    }

    return {
      message: 'Payment success, Booking confirmed',
      tranId: tran_id,
      valId: val_id,
      invoiceUrl: invoiceUploadUrl,
      ticketUrl: ticketUploadUrl,
    };
  }

  async onFail(payload: any) {
    const { tran_id } = payload || {};
    if (tran_id) {
      await this.paymentRepo.update({ tranId: tran_id }, { status: 'FAILED' });
    }
    return { message: 'Payment failed', tranId: tran_id };
  }

  async onCancel(payload: any) {
    const { tran_id } = payload || {};
    if (tran_id) {
      await this.paymentRepo.update(
        { tranId: tran_id },
        { status: 'CANCELLED' },
      );
    }
    return { message: 'Payment cancelled', tranId: tran_id };
  }

  async onIpn(body: any) {
    if (body?.tran_id && body?.val_id) {
      await this.onSuccess(body);
    }
    return { received: true };
  }

  async refund(tranId: string, amount: number, reason: string) {
    const randomNum = Math.floor(Math.random() * 999999);
    const data = {
      bank_tran_id: tranId,
      refund_trans_id: `REF${Date.now()}${randomNum}`,
      refund_amount: amount,
      refund_remarks: reason,
      store_id: process.env.SSLCZ_STORE_ID,
      store_passwd: process.env.SSLCZ_STORE_PASSWD,
      format: 'json',
    };
    return await this.sslcz.initiateRefund(data);
  }

  async refundQuery(refund_ref_id: string) {
    return await this.sslcz.refundQuery({ refund_ref_id });
  }

  async queryByTranId(tran_id: string) {
    return await this.sslcz.transactionQueryByTransactionId({ tran_id });
  }

  async queryBySession(sessionkey: string) {
    return await this.sslcz.transactionQueryBySessionId({ sessionkey });
  }

  async findMyPayments(
    userId: number,
    paginationDto: PaginationPaymentDto,
  ): Promise<PaginationResponseDto<PaymentResponseDTO>> {
    const { page, limit, tranId, status } = paginationDto;
    const where: any = { user: { id: userId } };
    if (tranId) where.tranId = Like(`%${tranId}%`);
    if (status) where.status = status;

    const [payments, total] = await this.paymentRepo.findAndCount({
      where,
      relations: ['user', 'event'],
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    });

    const data: PaymentResponseDTO[] = payments.map((p) => ({
      id: p.id,
      userId: p.user.id,
      userFullName: p.user.fullname,
      userEmail: p.user.email,
      tranId: p.tranId,
      eventId: p.event.id,
      eventTitle: p.event.title,
      amount: p.amount,
      status: p.status,
      method: p.method,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total_items: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findAll(
    paginationDto: PaginationPaymentDto,
  ): Promise<PaginationResponseDto<PaymentResponseDTO>> {
    const { page = 1, limit = 10, tranId, status } = paginationDto;
    const where: any = {};
    if (tranId) where.tranId = Like(`%${tranId}%`);
    if (status) where.status = status;

    const [payments, total] = await this.paymentRepo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
      relations: ['user', 'event'],
    });

    const data: PaymentResponseDTO[] = payments.map((p) => ({
      id: p.id,
      userId: p.user?.id,
      userFullName: p.user?.fullname,
      userEmail: p.user?.email,
      tranId: p.tranId,
      eventId: p.event?.id,
      eventTitle: p.event?.title,
      amount: p.amount,
      status: p.status,
      method: p.method,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total_items: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getPaymentById(id: number): Promise<PaymentResponseDTO> {
    return await this.paymentRepo.findOneBy({ id });
  }

  async findByTranId(tranId: string) {
    return this.paymentRepo.findOne({
      where: { tranId },
      relations: ['event', 'user'],
    });
  }

  async findBookingByPayment(paymentId: number) {
    return this.bookingsRepo.findOne({
      where: { payment: { id: paymentId } },
      relations: ['event', 'user'],
    });
  }
}
