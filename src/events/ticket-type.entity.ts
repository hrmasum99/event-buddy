// import { Column, CreateDateColumn, Entity, ManyToOne, OneToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
// import { EventEntity } from 'src/events/events.entity';

// @Entity('ticket_types')
// export class TicketType {

//   @PrimaryGeneratedColumn()
//   id: number;

//   @ManyToOne(() => EventEntity, (e) => e.ticketTypes, { eager: true })
//   event: EventEntity;

//   @Column({ default: 'general' })
//   ticketType: string; // general | vip | student | etc.

//   @Column({ type: 'int' })
//   seatsBooked: number;

//   @Column({ type: 'numeric', precision: 14, scale: 2 })
//   unitPrice: string;

//   @Column({ type: 'numeric', precision: 14, scale: 2 })
//   totalPaid: string;

//   @OneToOne(() => Payment, { eager: true })
//   @JoinColumn()
//   payment: Payment;

//   @CreateDateColumn()
//   createdAt: Date;
// }
