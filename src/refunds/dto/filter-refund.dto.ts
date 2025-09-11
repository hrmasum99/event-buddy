import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { RefundStatus } from '../refund.entity';
import { CancelReasonEnum } from 'src/common/enums/cancel-reason.enum';

export class FilterRefundsDto {
  @ApiPropertyOptional({ description: 'Filter by Event ID', example: 12 })
  @IsOptional()
  @IsNumber()
  eventId?: number;

  @ApiPropertyOptional({
    description: 'Filter by refund status',
    enum: RefundStatus,
    example: RefundStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;

  @ApiPropertyOptional({
    description: 'Filter by cancellation reason',
    enum: CancelReasonEnum,
    example: CancelReasonEnum.PERSONAL_REASONS,
  })
  @IsOptional()
  @IsEnum(CancelReasonEnum)
  cancelReason?: CancelReasonEnum;

  @ApiPropertyOptional({
    description: 'Filter refunds created after this date (YYYY-MM-DD)',
    example: '2025-09-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter refunds created before this date (YYYY-MM-DD)',
    example: '2025-09-10',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
