import { User } from 'src/users/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EventEntity } from 'src/events/entities/events.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Coupon } from 'src/events/entities/coupon.entity';
import { Payment } from 'src/payments/entities/payment.entity';

@Entity('bookings')
export class Booking {
  @ApiProperty({
    description: 'Unique identifier for the booking',
    example: 101,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.bookings, { eager: true })
  user: User;

  @ManyToOne(() => EventEntity, (event) => event.bookings, { eager: true })
  event: EventEntity;

  @ManyToOne(() => Coupon, { nullable: true, eager: true })
  coupon?: Coupon;

  @ApiProperty({
    description: 'Title of the event',
    example: 'Tech Conference 2025',
  })
  @Column({ nullable: true })
  eventTitle: string;

  @ApiProperty({ description: 'Number of seats booked', example: 2 })
  @Column('int', { nullable: true })
  seatsBooked: number;

  @ApiProperty({
    description: 'Ticket unit price',
    example: '250',
  })
  @Column({ nullable: true, type: 'numeric', precision: 14, scale: 2 })
  unitPrice: string;

  @ApiProperty({
    description: 'Number of seats booked',
    example: 2,
  })
  @Column('int', { nullable: true })
  quantity: number;

  @ApiProperty({
    description: 'Total paid',
    example: '1000',
  })
  @Column({ nullable: true, type: 'numeric', precision: 14, scale: 2 })
  totalPaid: string;

  @ManyToOne(() => Payment, (payment) => payment.bookings, {
    eager: true,
    nullable: true,
  })
  payment: Payment;

  @ApiProperty({
    description: 'Coupon code',
    example: 'EARLYBIRD20',
  })
  @Column({ nullable: true })
  couponCode?: string;

  @ApiProperty({
    description: 'Coupon discount percentage',
    example: '20',
  })
  @Column({ type: 'int', nullable: true })
  couponDiscount?: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'ACTIVE' | 'CANCELLED';
}
