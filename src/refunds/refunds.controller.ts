import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RefundsService } from './refunds.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/users/users.entity';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from 'src/common/enums/role.enum';
import { FilterRefundsDto } from './dto/filter-refund.dto';
import { IssueRefundDto } from './dto/issue-refund.dto';
import { RejectRefundDto } from './dto/reject-refund.dto';

@ApiTags('Refunds')
@ApiBearerAuth()
@Controller('refunds')
@UseGuards(JwtAuthGuard, RolesGuard) // ✅ Admin-only
@Roles(Role.Admin)
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all refunds (with filters for audit)' })
  @ApiResponse({ status: 200, description: 'List of refunds' })
  getAllRefunds(@Query() filterDto: FilterRefundsDto) {
    return this.refundsService.getAllRefunds(filterDto);
  }

  @Get('get-all')
  @ApiOperation({ summary: 'Get all refunds' })
  @ApiResponse({ status: 200, description: 'List of refunds' })
  findAll() {
    return this.refundsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get refund by id' })
  @ApiResponse({ status: 200, description: 'Get refund by id successfully' })
  findOne(@Param('id') id: number) {
    return this.refundsService.findOne(id);
  }

  @Patch('approve/:id')
  @ApiOperation({ summary: 'Approve a refund request' })
  @ApiResponse({ status: 200, description: 'Refund approved successfully' })
  approveRefund(
    @Param('id') id: number,
    @Body() dto: IssueRefundDto,
    @GetUser() admin: User,
  ) {
    return this.refundsService.approveRefund(id, dto.status, admin, dto.notes);
  }

  @Patch('reject/:id')
  @ApiOperation({ summary: 'Reject a refund request' })
  @ApiResponse({ status: 200, description: 'Refund rejected successfully' })
  rejectRefund(
    @Param('id') id: number,
    @Body() dto: RejectRefundDto,
    @GetUser() admin: User,
  ) {
    return this.refundsService.rejectRefund(id, admin, dto.notes);
  }
}
