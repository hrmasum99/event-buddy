import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Role } from 'src/common/enums/role.enum';
import { Booking } from 'src/bookings/entities/bookings.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Ticket } from 'src/documents/entities/tickets.entity';
import { Invoice } from 'src/documents/entities/invoices.entity';
import { EventEntity } from 'src/events/entities/events.entity';

@Entity('users')
export class User {
  @ApiProperty({ description: 'Unique identifier for the user', example: 10 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Full name of the user', example: 'MD Nishat' })
  @Column()
  fullname: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'nishat@example.com',
  })
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @ApiProperty({
    enum: Role,
    description: 'Role assigned to the user',
    example: Role.User,
  })
  @Column({ type: 'enum', enum: Role, default: Role.User })
  role: Role;

  @Column({ default: false })
  isTwoFactorEnabled: boolean;

  @Column({ nullable: true })
  twoFactorSecret?: string;

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => Invoice, (invoice) => invoice.user)
  invoices: Invoice[];

  @OneToMany(() => Ticket, (ticket) => ticket.user)
  tickets: Ticket[];

  @OneToMany(() => EventEntity, (event) => event.createdBy)
  createdEvents: EventEntity[];
}
