import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PaginationPaymentDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by transaction id' })
  @IsOptional()
  @IsString()
  tranId?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;
}
