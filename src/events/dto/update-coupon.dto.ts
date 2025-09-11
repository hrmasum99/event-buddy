import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class UpdateCouponDTO {
  @ApiPropertyOptional({
    example: 'EARLYBIRD20',
    description: 'Code of the coupon',
  })
  @IsNotEmpty({ message: 'Code is required' })
  @IsString({ message: 'Code must be a string' })
  code?: string;

  @ApiPropertyOptional({
    example: '',
    description: 'Title of the coupon',
  })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({
    message: 'Please enter a valid title of the coupon, it must be a string',
  })
  title?: string;

  @ApiPropertyOptional({
    example: 15,
    description: 'Discount percentage of coupon',
  })
  @IsNotEmpty({ message: 'Discount percentage is required' })
  @IsNumber({}, { message: 'Discount percentage must be a number' })
  @Min(0, { message: 'Total seats must be at least 0' })
  discountPercent?: number;

  @ApiPropertyOptional({
    description: 'Date and time of the start date of coupon',
    example: '2025-9-01T00:00:00Z',
  })
  @IsNotEmpty({ message: 'Date is required and should be ISO format' })
  validFrom?: Date;

  @ApiPropertyOptional({
    description: 'Date and time of the end date of coupon',
    example: '2025-10-01T23:59:59Z',
  })
  @IsNotEmpty({ message: 'Date is required and should be ISO format' })
  validTo?: Date;

  @ApiPropertyOptional({
    description: 'Active status of coupon',
    example: 'true or false',
  })
  @IsBoolean()
  active?: boolean;
}
