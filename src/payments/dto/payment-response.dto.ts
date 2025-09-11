// src/payments/dto/payment-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDTO {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  userFullName: string;

  @ApiProperty()
  userEmail: string;

  @ApiProperty()
  tranId: string;

  @ApiProperty()
  eventId: number;

  @ApiProperty()
  eventTitle: string;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  method: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
