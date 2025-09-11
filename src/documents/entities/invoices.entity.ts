import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Payment } from 'src/payments/entities/payment.entity';
import { User } from 'src/users/users.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invoices')
export class Invoice {
  @ApiProperty({ example: 1, description: 'Unique identifier for the invoice' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'https://cloudinary.com/invoice.pdf', description: 'URL of the invoice PDF' })
  @Column()
  url: string; // Cloudinary PDF URL

  @ManyToOne(() => User, (user) => user.invoices, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Payment, (payment) => payment.invoices, {
    onDelete: 'CASCADE',
  })
  payment: Payment;

  @ApiProperty({ example: '2025-09-08T10:00:00.000Z', description: 'Invoice creation date' })
  @CreateDateColumn()
  createdAt: Date;
}
