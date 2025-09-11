import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CancelReasonEnum } from 'src/common/enums/cancel-reason.enum';

export class CancelBookingDto {
  @ApiProperty({
    example: 'Change of plans',
    description: 'Reason for cancel the booking',
  })
  @IsEnum(CancelReasonEnum)
  reason: CancelReasonEnum;
}
