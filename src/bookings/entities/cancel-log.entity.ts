import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/users/users.entity';
import { Booking } from './bookings.entity';
import { Refund } from 'src/refunds/refund.entity';
import { CancelReasonEnum } from 'src/common/enums/cancel-reason.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cancel_logs')
export class CancelLog {
  @ApiProperty({ example: 1, description: 'Unique identifier for the cancel log' })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => Booking, { eager: true })
  booking: Booking;

  @ApiProperty({ enum: CancelReasonEnum, description: 'Reason for cancellation' })
  @Column({ type: 'enum', enum: CancelReasonEnum })
  reason: CancelReasonEnum;

  @ApiProperty({ example: false, description: 'Whether the cancellation is eligible for a refund' })
  @Column({ default: false })
  refundEligible: boolean;

  @ManyToOne(() => Refund, { nullable: true, eager: true })
  refund?: Refund;

  @ApiProperty({ example: '2025-09-08T10:00:00.000Z', description: 'Cancellation log creation date' })
  @CreateDateColumn()
  createdAt: Date;
}
