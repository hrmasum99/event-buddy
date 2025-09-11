import { ApiProperty } from '@nestjs/swagger';

export class CouponResponseDTO {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    example: 'EARLYBIRD20',
    description: 'Code of the coupon',
  })
  code: string;

  @ApiProperty({
    example: '',
    description: 'Title of the coupon',
  })
  title: string;

  @ApiProperty({ example: 15, description: 'Discount percentage of coupon' })
  discountPercent: number;

  @ApiProperty({
    description: 'Date and time of the start date of coupon',
    example: '2025-9-01T00:00:00Z',
  })
  validFrom: Date;

  @ApiProperty({
    description: 'Date and time of the end date of coupon',
    example: '2025-10-01T23:59:59Z',
  })
  validTo: Date;

  @ApiProperty({
    description: 'Active status of coupon',
    example: 'true or false',
  })
  active: boolean;
}
