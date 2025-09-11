import { EventEntity } from 'src/events/entities/events.entity';
import { User } from 'src/users/users.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tickets')
export class Ticket {
  @ApiProperty({ example: 1, description: 'Unique identifier for the ticket' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'https://cloudinary.com/ticket.pdf', description: 'URL of the ticket PDF' })
  @Column()
  url: string; // Cloudinary PDF URL

  @ManyToOne(() => User, (user) => user.tickets, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => EventEntity, (event) => event.tickets, {
    onDelete: 'CASCADE',
  })
  event: EventEntity;

  @ApiProperty({ example: '2025-09-08T10:00:00.000Z', description: 'Ticket creation date' })
  @CreateDateColumn()
  createdAt: Date;
}
