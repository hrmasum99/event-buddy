import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Like, ObjectId, Repository } from 'typeorm';
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
import { SSLRefundResponse } from 'src/refunds/dto/issue-refund.dto';

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

  private async fetchFileFromUrl(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }

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

    // Same seat + event validations
    if (new Date(booking.event.date) < now) {
      throw new BadRequestException(
        'Event date has already expired!!! You cannot book seats for this past event.',
      );
    }

    // // Check how many seats the user already booked for this event
    // const existingBookings = await this.bookingsRepo.find({
    //   where: { user: { id: userId }, event: { id: dto.eventId } },
    // });

    // const alreadyBookedSeats = existingBookings.reduce(
    //   (sum, b) => sum + b.seatsBooked,
    //   0,
    // );

    // if (alreadyBookedSeats >= 4) {
    //   throw new BadRequestException(
    //     `You have already booked ${alreadyBookedSeats} seats for this event. Maximum allowed is 4.`,
    //   );
    // }

    // const requestedSeats = dto.seatsBooked;

    // if (event.totalSeats < requestedSeats) {
    //   throw new BadRequestException('Not enough seats available!');
    // }

    // Coupon
    const { discountPercent, coupon } = await this.applyCoupon(dto.couponCode);

    const { total } = this.calcTotal(
      Number(booking.unitPrice),
      booking.quantity,
      discountPercent,
    );

    console.log(`Unit Price: ${booking.unitPrice},
      qty: ${booking.quantity},
      discount: ${discountPercent}, 
      Total: ${total}`);

    // // Creates only Date object from the current Date
    // const currentDate = new Date();
    // const year = currentDate.getFullYear();
    // const month = currentDate.getMonth() + 1; // getMonth() is zero-based (0=Jan)
    // const day = currentDate.getDate();
    // // You can format this as a string, e.g., 'DDMMYYYY'
    // const dateString = `${day.toString().padStart(2, '0')}${month.toString().padStart(2, '0')}${year}`;

    // OR
    // Create unique tran_id
    const dateString = now.toISOString().slice(0, 10).replace(/-/g, '');

    // Create a unique tran_id
    const tranId = `EVT${booking.event.id}${Math.floor(Math.random() * 9999)}${dateString}`;

    // Save INITIATED payment (so we can find it on success)
    const payment = this.paymentRepo.create({
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

    // Build SSLCommerz init payload (Call SSLCommerz)
    const data = {
      total_amount: Number(total.toFixed(2)),
      currency: 'BDT',
      tran_id: tranId,
      success_url:
        process.env.PAYMENT_SUCCESS_URL ||
        'http://localhost:7000/Payments/success',
      fail_url:
        process.env.PAYMENT_FAIL_URL || 'http://localhost:7000/Payments/fail',
      cancel_url:
        process.env.PAYMENT_CANCEL_URL ||
        'http://localhost:7000/Payments/cancel',
      ipn_url:
        process.env.PAYMENT_IPN_URL || 'http://localhost:7000/Payments/ipn',

      shipping_method: 'N/A',
      product_name: `${booking.event.title} x${booking.quantity}`,
      product_category: 'Event Ticket',
      product_profile: 'general',

      cus_name: booking.user.fullname,
      cus_email: booking.user.email,
      cus_add1: 'N/A',
      cus_add2: 'N/A',
      cus_city: 'N/A',
      cus_state: 'N/A',
      cus_postcode: 'N/A',
      cus_country: 'Bangladesh',
      cus_phone: 'N/A',
      cus_fax: 'N/A',

      ship_name: booking.user.fullname,
      ship_add1: 'N/A',
      ship_add2: 'N/A',
      ship_city: 'N/A',
      ship_state: 'N/A',
      ship_postcode: 'N/A',
      ship_country: 'Bangladesh',
    };

    const apiResponse = await this.sslcz.init(data);
    console.log('SSLCommerz Init Response:', apiResponse);

    const gatewayUrl = apiResponse?.GatewayPageURL;
    if (!gatewayUrl) throw new BadRequestException('Failed to get payment URL');

    // Temporarily stash ticket context in Payment using JSON fields if you prefer
    // Or just recreate from frontend on success callback using tranId.
    // Here we store a draft TicketSale (optional). Simpler: store lightweight context on Payment.
    await this.paymentRepo.update(
      { id: payment.id },
      { method: dto.method || 'Unpsecified' }, //i havenot use ticketType // reusing 'method' to keep the ticketType hint (or add a new column)
    );

    return { gatewayUrl, tranId };
  }

  async onSuccess(query: any) {
    const { val_id, tran_id } = query || {};
    if (!tran_id) throw new BadRequestException('Missing tran_id');

    // Validate payment with SSLCommerz
    const res = await this.sslcz.validate({ val_id });
    if (!res || (res.status !== 'VALID' && res.status !== 'VALIDATED')) {
      throw new BadRequestException('Payment not validated');
    }

    // Find payment
    const payment = await this.paymentRepo.findOne({
      where: { tranId: tran_id },
      relations: ['user', 'event'],
    });
    if (!payment) throw new NotFoundException('Payment not found');

    // Find pending booking
    const booking = await this.bookingsRepo.findOne({
      where: {
        user: { id: payment.user.id },
        event: { id: payment.event.id },
        status: 'PENDING',
      },
    });
    if (!booking) throw new NotFoundException('Pending booking not found');

    // Mark success
    payment.status = 'SUCCESS';
    payment.valId = val_id;
    payment.method = res.card_type || payment.method;
    await this.paymentRepo.save(payment);

    // const booking = this.bookingsRepo.create({
    //   user: payment.user,
    //   event: payment.event,
    //   seatsBooked: payment.quantity,
    //   eventTitle: payment.eventTitle,
    //   unitPrice: payment.event.ticketPrice,
    //   totalPaid: payment.amount,
    //   payment,
    //   quantity: payment.quantity,
    //   couponCode: payment.couponCode,
    //   couponDiscount: payment.couponDiscount,
    // });

    // Update booking
    await this.bookingsRepo.update(
      { id: booking.id },
      {
        status: 'ACTIVE',
        seatsBooked: booking.quantity,
        totalPaid: payment.amount.toString(),
        payment,
      },
    );

    // Update event revenue
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

    // 1. Generate PDFs (buffers)
    const invoiceBuffer = await this.pdfService.generateInvoiceBuffer({
      id: payment.id,
      customer: payment.user.fullname,
      amount: Number(payment.amount),
      billTo: `${payment.user.fullname} <${payment.user.email}>`,
      billFrom: 'Event Buddy', // your company name
      date: new Date().toISOString().split('T')[0], // yyyy-mm-dd
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

    console.log(`name: ${payment.event.title},
          qty: ${booking.seatsBooked},
          total: ${payment.amount},
          price: ${payment.event.ticketPrice},`);

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
        imageUrl, // ✅ pass correct bg image URL
        ticketNo,
        qty: payment.quantity,
      },
      {
        fullname: payment.user.fullname,
        email: payment.user.email,
      },
    );

    // 2. Upload to Cloudinary (for persistent URL storage)
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

    // ✅ Save URLs in DB
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

    // 3. Send Email with local buffers (no Cloudinary fetch!)

    await this.mailerService.sendMail({
      to: payment.user.email,
      subject: `${payment.event.title} Payment Confirmation`,
      html: `<p>Thank you for your payment! 🎉</p>
           <p>Attached is your event invoice</p>`,
      attachments: [
        {
          filename: `INV${payment.id}-${dateString}${randomNum}.pdf`,
          content: invoiceBuffer, // ✅ Directly attach buffer
        },
      ],
    });

    await this.mailerService.sendMail({
      to: payment.user.email,
      subject: `Download ${payment.event.title} Ticket`,
      html: `<p>Thank you for your purchase! 🎉</p>
           <p>Attached is your event ticket</p>`,
      attachments: [
        {
          filename: `TKT${payment.id}-${dateString}${randomNum}.pdf`,
          content: ticketBuffer, // ✅ Directly attach buffer
        },
      ],
    });

    return {
      message: `Payment success, Booking confirmed, Invoice and Ticket sent to "${payment.cusEmail}"`,
      tranId: tran_id,
      valId: val_id,
      invoiceUrl: invoiceUploadUrl, // ✅ persist for download
      ticketUrl: ticketUploadUrl, // ✅ persist for download
    };
  }

  async onFail(query: any) {
    const { tran_id } = query || {};
    if (tran_id) {
      await this.paymentRepo.update({ tranId: tran_id }, { status: 'FAILED' });
    }
    return { message: 'Payment failed', tranId: tran_id };
  }

  async onCancel(query: any) {
    const { tran_id } = query || {};
    if (tran_id) {
      await this.paymentRepo.update(
        { tranId: tran_id },
        { status: 'CANCELLED' },
      );
    }
    return { message: 'Payment cancelled', tranId: tran_id };
  }

  async onIpn(body: any) {
    // Optionally validate and update statuses; often IPN duplicates success.
    // You can call validate again here using val_id if provided.
    return { received: true };
  }

  // async refund(
  //   bank_tran_id: string,
  //   refund_amount: number,
  //   refund_remarks = '',
  //   refe_id?: string,
  // ) {
  //   const data = {
  //     refund_amount: refund_amount,
  //     refund_remarks,
  //     bank_tran_id,
  //     refe_id: refe_id || `REF-${Date.now()}`,
  //   };
  //   return await this.sslcz.initiateRefund(data);
  // }

  async refund(tranId: string, amount: number, reason: string) {
    const randomNum = Math.floor(Math.random() * 999999);

    const data = {
      bank_tran_id: tranId,
      refund_trans_id: `REF${Date.now()}${randomNum}`, // ✅ Mandatory unique ID
      refund_amount: amount,
      refund_remarks: reason,
      store_id: process.env.SSLCZ_STORE_ID, // ✅ must include
      store_passwd: process.env.SSLCZ_STORE_PASSWD,
      format: 'json',
    };
    return await this.sslcz.initiateRefund(data);
  }

  // async refund(
  //   tranId: string,
  //   amount: number,
  //   reason: string,
  // ): Promise<SSLRefundResponse> {
  //   try {
  //     const payload = {
  //       store_id: this.config.get<string>('SSLCZ_STORE_ID'),
  //       store_passwd: this.config.get<string>('SSLCZ_STORE_PASS'),
  //       refund_amount: amount,
  //       refund_remarks: reason || 'Refund issued',
  //       bank_tran_id: tranId,
  //     };

  //     const response = await axios.post(
  //       'https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php',
  //       null, // SSLCommerz expects query string format
  //       { params: payload },
  //     );

  //     // this.logger.debug(`Refund response: ${JSON.stringify(response.data)}`);
  //     console.log(`Refund response: ${JSON.stringify(response.data)}`);

  //     if (
  //       response.data?.APIConnect === 'DONE' &&
  //       response.data?.status === 'VALID'
  //     ) {
  //       return response.data; // ✅ return full response, not just boolean
  //     }

  //     return null;
  //   } catch (err) {
  //     // this.logger.error('Refund API error', err);
  //     throw new BadRequestException(
  //       'Failed to call SSLCommerz refund API.' +
  //         `Error message is: : ${err.message}`,
  //     );
  //   }
  // }

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

    const where: any = { user: { id: userId } }; // 👈 filter by logged-in user
    if (tranId) where.tranId = Like(`%${tranId}%`);
    if (status) where.status = status;

    const [payments, total] = await this.paymentRepo.findAndCount({
      where,
      relations: ['user', 'event'], // 👈 so we can access user & event info
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

    // also load relations for user + event
    const [payments, total] = await this.paymentRepo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
      relations: ['user', 'event'], // 👈 make sure you have relations defined in Payment entity
    });

    // map Payment entity -> PaymentResponseDTO
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
}
