import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Booking } from "./bookings.entity";
import { Repository } from "typeorm";
import { BookingResponseDTO } from "./dto/booking-response.dto";
import { User } from "src/users/users.entity";
import { EventEntity } from "src/events/events.entity";
import { CreateBookingDTO } from "./dto/create-booking.dto";
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginationResponseDto } from 'src/common/dto/pagination-response.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepo: Repository<Booking>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(EventEntity)
    private eventsRepo: Repository<EventEntity>,
  ) {}

  async findAll(id: number, paginationDto: PaginationDto): Promise<PaginationResponseDto<BookingResponseDTO>> {
    const { page, limit } = paginationDto;
    const [result, total] = await this.bookingsRepo.findAndCount({
      where: { user: { id: id } },
      relations: ['user', 'event'],
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data: result,
      meta: {
        page,
        limit,
        total_items: total,
        total_pages: Math.ceil(total / limit),
      },
    };
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


  async newBooking(id: number, eventId: number, seatsBooked: CreateBookingDTO): Promise<BookingResponseDTO> {
  
    const user = await this.userRepo.findOne({ where: { id: id } });
    if (!user) {
      throw new NotFoundException(`User ID:${id} not found`);
    }

    const event = await this.eventsRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(`Event ID:${eventId} not found`);
    }

    const now = new Date();
    if (new Date(event.date) < now) {
      throw new BadRequestException('Event date has already expired!!! You cannot book seats for this past event.');
    }

    const requestedSeats = seatsBooked.seatsBooked;

    if (event.totalSeats < requestedSeats) {
      throw new BadRequestException('Not enough seats available!');
    }

    const booking = this.bookingsRepo.create({
      user,
      event,
      seatsBooked: requestedSeats,
    });

    return await this.bookingsRepo.save(booking);
  }

  async cancelBooking(id: number): Promise<void> {
    const booking = await this.bookingsRepo.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID:${id} not found`);
    }
    await this.bookingsRepo.delete(id);
  }
}