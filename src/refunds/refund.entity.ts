import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/users/users.entity';
import { EventEntity } from 'src/events/entities/events.entity';
import { Booking } from 'src/bookings/entities/bookings.entity';
import { CancelReasonEnum } from 'src/common/enums/cancel-reason.enum';
import { ApiProperty } from '@nestjs/swagger';

export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('refunds')
export class Refund {
  @ApiProperty({ example: 1, description: 'Unique identifier for the refund' })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Booking, { eager: true })
  booking: Booking;

  @ManyToOne(() => EventEntity, { eager: true })
  event: EventEntity;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ApiProperty({ enum: CancelReasonEnum, description: 'Reason for the refund' })
  @Column({ type: 'enum', enum: CancelReasonEnum })
  reason: CancelReasonEnum;

  @ApiProperty({ enum: RefundStatus, description: 'Status of the refund' })
  @Column({ type: 'enum', enum: RefundStatus, default: RefundStatus.PENDING })
  status: RefundStatus;

  @ApiProperty({ description: 'Refund transition id of the refund' })
  @Column({ nullable: true })
  refundRefId?: string;

  @ApiProperty({ example: 1500, description: 'Amount to be refunded' })
  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  // ✅ Admin auditing info
  @ManyToOne(() => User, { eager: true, nullable: true })
  admin?: User; // which admin approved/rejected

  @ApiProperty({
    example: 'Admin User',
    description: 'Name of the admin who processed the refund',
  })
  @Column({ nullable: true })
  adminName?: string;

  @ApiProperty({
    example: 'admin@example.com',
    description: 'Email of the admin who processed the refund',
  })
  @Column({ nullable: true })
  adminEmail?: string;

  @ApiProperty({
    example: 'Refund approved',
    description: 'Notes from the admin',
  })
  @Column({ nullable: true })
  adminNote?: string;

  @ApiProperty({
    example: '2025-09-08T10:00:00.000Z',
    description: 'Refund creation date',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2025-09-08T10:00:00.000Z',
    description: 'Refund last update date',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
