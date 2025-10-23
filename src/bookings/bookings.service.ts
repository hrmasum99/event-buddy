import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from './entities/bookings.entity';
import { Repository } from 'typeorm';
import { BookingResponseDTO } from './dto/booking-response.dto';
import { User } from 'src/users/users.entity';
import { EventEntity } from 'src/events/entities/events.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginationResponseDto } from 'src/common/dto/pagination-response.dto';
import { PaymentsService } from 'src/payments/payments.service';
import { Payment } from 'src/payments/entities/payment.entity';
import {
  toCouponResponseDTO,
  toEventResponseDTO,
  toPaymentResponseDTO,
  toUserResponseDTO,
} from 'src/common/utils/mappers';
import { CancelLog } from './entities/cancel-log.entity';
import { Refund, RefundStatus } from 'src/refunds/refund.entity';
import { CancelReasonEnum } from 'src/common/enums/cancel-reason.enum';
import { CreateBookingDTO } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepo: Repository<Booking>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(EventEntity)
    private eventsRepo: Repository<EventEntity>,
    private readonly paymentsService: PaymentsService,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(CancelLog)
    private cancelLogRepo: Repository<CancelLog>,
    @InjectRepository(Refund)
    private refundRepo: Repository<Refund>,
  ) {}

  async findAll(
    id: number,
    paginationDto: PaginationDto,
  ): Promise<PaginationResponseDto<BookingResponseDTO>> {
    const { page, limit } = paginationDto;
    const [result, total] = await this.bookingsRepo.findAndCount({
      where: { user: { id: id } },
      relations: ['user', 'event'],
      take: limit,
      skip: (page - 1) * limit,
    });

    const data: BookingResponseDTO[] = result.map((b) => ({
      id: b.id,
      user: toUserResponseDTO(b.user),
      event: toEventResponseDTO(b.event),
      coupon: toCouponResponseDTO(b.coupon),
      payment: toPaymentResponseDTO(b.payment),
      status: b.status,
      eventTitle: b.event.title,
      createdAt: b.createdAt,
      unitPrice: b.unitPrice,
      totalPaid: b.totalPaid,
      seatsBooked: b.seatsBooked,
      quantity: b.quantity,
    }));

    return {
      data: data,
      meta: {
        page,
        limit,
        total_items: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getBookingById(id: number): Promise<BookingResponseDTO> {
    return await this.bookingsRepo.findOneBy({ id: id });
  }

  async getAvailableSeats(id: number): Promise<number> {
    const event = await this.eventsRepo.findOne({ where: { id: id } });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    const result = await this.bookingsRepo
      .createQueryBuilder('booking')
      .select('SUM(booking.seatsBooked)', 'sum')
      .where('booking.eventId = :id', { id })
      .getRawOne();

    const bookedSeats = parseInt(result.sum) || 0;
    const availableSeats = event.totalSeats - bookedSeats;

    return availableSeats;
  }

  async newBooking(
    userId: number,
    eventId: number,
    dto: CreateBookingDTO,
  ): Promise<BookingResponseDTO> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ID:${userId} not found`);

    const event = await this.eventsRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Event ID:${eventId} not found`);

    // ✅ Same date check
    const now = new Date();
    if (new Date(event.date) < now) {
      throw new BadRequestException(
        'Event date has already expired!!! You cannot book seats for this past event.',
      );
    }

    // ✅ Prevent exceeding max 4 seats per user
    const existingBookings = await this.bookingsRepo.find({
      where: { user: { id: userId }, event: { id: eventId } },
    });
    const alreadyBookedSeats = existingBookings.reduce(
      (sum, b) => sum + b.seatsBooked,
      0,
    );
    if (alreadyBookedSeats >= 4) {
      throw new BadRequestException(
        `You have already booked ${alreadyBookedSeats} seats for this event. Maximum allowed is 4.`,
      );
    }

    // ✅ Check availability
    if (event.totalSeats < dto.quantity) {
      throw new BadRequestException('Not enough seats available!');
    }

    // ✅ Create booking with PENDING status
    const booking = this.bookingsRepo.create({
      user, // issue : show user password !!!
      event,
      eventTitle: event.title,
      quantity: dto.quantity,
      unitPrice: event.ticketPrice,
      totalPaid: '0',
      status: 'PENDING',
      createdAt: new Date(),
    });

    return await this.bookingsRepo.save(booking);
  }

  async cancelBooking(
    bookingId: number,
    reason: CancelReasonEnum,
  ): Promise<{ message: string }> {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
      relations: ['payment', 'event', 'user'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID:${bookingId} not found`);
    }

    const eventDate = new Date(booking.event.date);
    const now = new Date();

    if (eventDate <= now) {
      throw new BadRequestException(
        'Cancellation not allowed. Event has already started or passed.',
      );
    }

    const diffInMs = eventDate.getTime() - now.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    let refund: Refund = null;
    let message = '';

    // Case 1: Event is < 1 day away → cancel without refund
    if (diffInDays < 1) {
      message =
        'Booking cancelled. No refund allowed since event is less than 1 day away.';

      await this.cancelLogRepo.save(
        this.cancelLogRepo.create({
          user: booking.user,
          booking,
          reason,
          refundEligible: false,
        }),
      );

      await this.bookingsRepo.update(bookingId, {
        status: 'CANCELLED',
        seatsBooked: 0, // Release seats
      });

      return { message };
    }

    // Case 2: Event is >= 1 day away → refund pending (admin will approve)
    if (diffInDays >= 1) {
      refund = this.refundRepo.create({
        user: booking.user,
        event: booking.event,
        booking,
        reason,
        amount: Number(booking.payment?.amount || booking.totalPaid),
        status: RefundStatus.PENDING,
      });

      await this.refundRepo.save(refund);

      await this.cancelLogRepo.save(
        this.cancelLogRepo.create({
          user: booking.user,
          booking,
          reason,
          refundEligible: true,
          refund,
        }),
      );

      await this.bookingsRepo.update(bookingId, { status: 'CANCELLED' });

      message =
        'Booking cancelled. Refund request is pending. Admin will process your refund.';
    }

    return { message };
  }
}
