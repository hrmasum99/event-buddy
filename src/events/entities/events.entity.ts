import { ApiProperty } from '@nestjs/swagger';
import { Booking } from 'src/bookings/entities/bookings.entity';
import { Ticket } from 'src/documents/entities/tickets.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Coupon } from './coupon.entity';
import { User } from 'src/users/users.entity';
// import { TicketType } from './ticket-type.entity';

@Entity('events')
export class EventEntity {
  @ApiProperty({ description: 'Unique identifier for the event', example: 101 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Title of the event',
    example: 'Tech Conference 2025',
  })
  @Column()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the event',
    example: 'A global tech event...',
  })
  @Column()
  description: string;

  @ApiProperty({
    description: 'Date and time of the event',
    example: '2025-10-01T14:00:00Z',
  })
  @Column({ type: 'timestamp' })
  date: Date;

  @ApiProperty({
    description: 'Location of the event',
    example: 'San Francisco, CA',
  })
  @Column()
  location: string;

  @ApiProperty({ description: 'Total number of available seats', example: 150 })
  @Column('int')
  totalSeats: number;

  @ApiProperty({
    description: 'Tags or categories related to the event',
    example: 'Tech, AI, Startup',
  })
  @Column()
  tags: string;

  // Store Cloudinary URL instead of filename
  @ApiProperty({ description: 'Store Cloudinary URL', example: '' })
  @Column({ nullable: true })
  imageUrl: string;

  // Store Cloudinary public_id for deletion/updates
  @ApiProperty({
    description: 'Store Cloudinary public_id for deletion/updates',
    example: '',
  })
  @Column({ nullable: true })
  imagePublicId: string;

  @ApiProperty({
    description: 'Ticket unit price',
    example: '250',
  })
  @Column({ nullable: true, type: 'numeric', precision: 14, scale: 2 })
  ticketPrice: string;

  @ApiProperty({
    description: 'Store total revenue from selling the tickets',
    example: '10000',
  })
  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalRevenue: string; // keep as string when using numeric

  @Column({ nullable: true })
  twoFASecret?: string;

  @OneToMany(() => Booking, (booking) => booking.event)
  bookings: Booking[];

  @OneToMany(() => Payment, (p) => p.event)
  payments: Payment[];

  @OneToMany(() => Ticket, (ticket) => ticket.event)
  tickets: Ticket[];

  @OneToMany(() => Coupon, (coupon) => coupon.event)
  coupons: Coupon[];

  @ManyToOne(() => User, (user) => user.createdEvents, {
    onDelete: 'CASCADE',
  })
  createdBy: User;
}
