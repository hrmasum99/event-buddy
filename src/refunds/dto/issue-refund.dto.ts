import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CancelReasonEnum } from '../../common/enums/cancel-reason.enum';
import { RefundStatus } from '../refund.entity';

export class IssueRefundDto {
  // @ApiProperty({
  //   description: 'Reason for the refund',
  //   enum: CancelReasonEnum,
  //   example: CancelReasonEnum.CHANGE_OF_PLANS,
  // })
  // @IsEnum(CancelReasonEnum)
  // reason: CancelReasonEnum;

  @ApiProperty({
    enum: RefundStatus,
    description: 'Reason for the refund',
    example: RefundStatus.APPROVED,
  })
  status: RefundStatus;

  @ApiProperty({
    description: 'Additional notes for refund (optional)',
    required: false,
    example: `Event was cancelled due to ${CancelReasonEnum.CHANGE_OF_PLANS}`,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SSLRefundResponse {
  APIConnect: string;
  bank_tran_id: string;
  trans_id: string;
  refund_ref_id?: string;
  status: RefundStatus;
  errorReason?: string;
}
