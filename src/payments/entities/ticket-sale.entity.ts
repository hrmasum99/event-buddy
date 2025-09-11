// import {
//   Column,
//   CreateDateColumn,
//   Entity,
//   ManyToOne,
//   OneToOne,
//   JoinColumn,
//   PrimaryGeneratedColumn,
// } from 'typeorm';
// import { EventEntity } from 'src/events/events.entity';
// import { User } from 'src/users/users.entity';
// import { Coupon } from './coupon.entity';
// import { Payment } from './payment.entity';
// import { ApiProperty } from '@nestjs/swagger';

// @Entity('ticket_sales')
// export class TicketSale {
//   @ApiProperty({
//     description: 'Unique identifier for the payment',
//     example: 101,
//   })
//   @PrimaryGeneratedColumn()
//   id: number;

//   @ManyToOne(() => User, { eager: true })
//   user: User;

//   @ManyToOne(() => EventEntity, (e) => e.ticketSales, { eager: true })
//   event: EventEntity;

//   @ApiProperty({
//     description: 'Title of the event',
//     example: 'Tech Conference 2025',
//   })
//   @Column()
//   eventTitle: string;

//   // @Column({ default: 'general' })
//   // ticketType: string; // general | vip | student | etc.

//   @ApiProperty({
//     description: 'Ticket seatsBooked (Response from booking)',
//     example: '4',
//   })
//   @Column({ type: 'int' })
//   seatsBooked: number;

//   @ManyToOne(() => Coupon, { nullable: true, eager: true })
//   coupon?: Coupon;

//   @ApiProperty({
//     description: 'Ticket unit price',
//     example: '250',
//   })
//   @Column({ type: 'numeric', precision: 14, scale: 2 })
//   unitPrice: string;

//   @ApiProperty({
//     description: 'Total paid',
//     example: '1000',
//   })
//   @Column({ type: 'numeric', precision: 14, scale: 2 })
//   totalPaid: string;

//   @OneToOne(() => Payment, { eager: true })
//   @JoinColumn()
//   payment: Payment;

//   @CreateDateColumn()
//   createdAt: Date;
// }
