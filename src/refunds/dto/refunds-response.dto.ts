import { ApiProperty } from '@nestjs/swagger';
import { RefundStatus } from '../refund.entity';

export class RefundResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  reason: string;

  @ApiProperty({ enum: RefundStatus })
  status: RefundStatus;

  @ApiProperty()
  refundRefId?: string;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  adminName?: string;

  @ApiProperty()
  adminEmail?: string;

  @ApiProperty()
  adminNote?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Only minimal booking info
  booking: {
    id: number;
    eventTitle: string;
    totalPaid: string;
    status: string;
  };

  // Only minimal event info
  event: {
    id: number;
    title: string;
    date: Date;
    location: string;
    ticketPrice: string;
  };

  // Only safe user info
  user: {
    id: number;
    fullname: string;
    email: string;
  };

  admin?: {
    id: number;
    fullname: string;
    email: string;
    role: string;
  };
}
