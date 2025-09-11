import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectRefundDto {
  @ApiProperty({
    description: 'Reason for rejecting the refund (optional)',
    required: false,
    example: 'User already attended the event, no refund possible',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
