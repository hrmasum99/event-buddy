import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class InitiatePaymentDTO {
  @ApiProperty({ example: 123 })
  @IsInt()
  @Min(1)
  bookingId: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  eventId: number;

  // @ApiProperty({ example: 'vip' })
  // @IsString()
  // @IsNotEmpty()
  // ticketType: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  seatsBooked: number;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @ApiProperty({ required: false, example: 'EARLYBIRD20' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({
    example: 'bkash',
    description: 'Payment method (bkash/nagad/card etc.)',
  })
  @IsOptional()
  @IsString()
  method?: string;

  // Optional overrides for callback URLs (usually you keep defaults from env)
  @IsOptional() success_url?: string;
  @IsOptional() fail_url?: string;
  @IsOptional() cancel_url?: string;
  @IsOptional() ipn_url?: string;
}
