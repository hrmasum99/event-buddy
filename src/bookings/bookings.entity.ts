import { User } from "src/users/users.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { EventEntity } from "src/events/events.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity("bookings")
export class Booking {
  @ApiProperty({ description: 'Unique identifier for the booking', example: 101 })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.bookings)
  user: User;

  @ManyToOne(() => EventEntity, event => event.bookings)
  event: EventEntity;

  @ApiProperty({ description: 'Number of seats booked', example: 2 })
  @Column('int')
  seatsBooked: number;
}
