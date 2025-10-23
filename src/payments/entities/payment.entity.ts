import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EventEntity } from 'src/events/entities/events.entity';
import { User } from 'src/users/users.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Booking } from 'src/bookings/entities/bookings.entity';
import { Invoice } from 'src/documents/entities/invoices.entity';

export type PaymentStatus =
  | 'INITIATED'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

@Entity('payments')
export class Payment {
  @ApiProperty({
    description: 'Unique identifier for the payment',
    example: 101,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => EventEntity, (e) => e.payments, { eager: true })
  event: EventEntity;

  @ManyToOne(() => User, (u) => u.id, { eager: true })
  user: User;

  @OneToMany(() => Booking, (booking) => booking.payment)
  bookings: Booking[];

  @ApiProperty({
    description: 'Booking Id',
    example: '123',
  })
  @Column({ nullable: true })
  bookingId: number;

  @ApiProperty({
    description: 'Title of the event',
    example: 'Tech Conference 2025',
  })
  @Column()
  eventTitle: string;

  @ApiProperty({
    description: 'Qauntity of seats',
    example: 3,
  })
  @Column({ type: 'int', nullable: true })
  quantity: number; // total charged

  @ApiProperty({
    description: 'Payment total charged',
    example: 1000,
  })
  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string; // total charged

  @ApiProperty({
    description: 'SSLCommerz payment tran_id',
    example: '',
  })
  @Column({ nullable: true })
  tranId: string; // SSLCommerz tran_id

  @ApiProperty({
    description: 'SSLCommerz validation id (success response)',
    example: '',
  })
  @Column({ nullable: true })
  valId: string; // SSLCommerz validation id (success response)

  @ApiProperty({
    description: 'Currency',
    example: 'BDT',
  })
  @Column({ default: 'BDT' })
  currency: string;

  @ApiProperty({
    description: 'Payment Geteway',
    example: 'SSLCommerz',
  })
  @Column({ default: 'SSLCommerz' })
  gateway: string;

  @ApiProperty({
    description: 'Payment method (from SSLCommerz response)',
    example: 'CARD/BANK/MFS',
  })
  @Column({ nullable: true })
  method: string; // CARD/BANK/MFS (from SSLCommerz response)

  @ApiProperty({
    description: 'User`s Full Name',
    example: 'John Doe',
  })
  @Column({ nullable: true })
  cusName: string;

  @ApiProperty({
    description: 'User`s Email',
    example: 'johndoe@example.com',
  })
  @Column({ nullable: true })
  cusEmail: string;

  @ApiProperty({
    description: 'Payment status',
    example: 'INITIATED/SUCCESS/FAILED/CANCELLED',
  })
  @Column({ type: 'varchar', default: 'INITIATED' })
  status: PaymentStatus;

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

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Invoice, (invoice) => invoice.payment)
  invoices: Invoice[];
}
