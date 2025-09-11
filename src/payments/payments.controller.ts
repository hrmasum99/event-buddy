import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/users/users.entity';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDTO } from './dto/payment.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from 'src/common/enums/role.enum';
import { PaginationResponseDto } from 'src/common/dto/pagination-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginationPaymentDto } from './dto/pagination-payment.dto';
import { PaymentResponseDTO } from './dto/payment-response.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a payment for a booking' })
  @ApiCreatedResponse({
    description: 'Booking initiated successfully',
    type: InitiatePaymentDTO,
  }) // BookingResponseDTO
  @ApiBadRequestResponse({ description: 'Booking initiation failed' })
  @ApiOkResponse({ description: 'Returns Gateway URL and tranId' })
  async initiate(@GetUser() user: User, @Body() dto: InitiatePaymentDTO) {
    const { gatewayUrl, tranId } = await this.paymentsService.initiate(
      user.id,
      dto,
    );
    return { message: 'Redirect to gateway', data: { gatewayUrl, tranId } };
  }

  // Handle SSLCommerz redirect (user browser redirect)
  @Get('success')
  @ApiExcludeEndpoint()
  async successGet(@Query() query: any) {
    const result = await this.paymentsService.onSuccess(query);
    return { message: 'Payment success (GET)', data: result };
  }

  // Handle SSLCommerz server-to-server POST
  @Post('success')
  @ApiExcludeEndpoint()
  async successPost(@Body() body: any, @Query() query: any) {
    const data = { ...query, ...body }; // merge both
    const result = await this.paymentsService.onSuccess(data);
    return { message: 'Payment success (POST)', data: result };
  }

  // // SSLCommerz will redirect here on success (GET with query params)
  // @Post('success')
  // async success(@Query() query: any) {
  //   const result = await this.paymentsService.onSuccess(query);
  //   return { message: 'Payment success', data: result };
  // }

  // SSLCommerz will redirect here on fail
  @Post('fail')
  @ApiExcludeEndpoint()
  async fail(@Query() query: any) {
    const result = await this.paymentsService.onFail(query);
    return { message: 'Payment failed', data: result };
  }

  // SSLCommerz will redirect here on cancel
  @Post('cancel')
  @ApiExcludeEndpoint()
  async cancel(@Query() query: any) {
    const result = await this.paymentsService.onCancel(query);
    return { message: 'Payment cancelled', data: result };
  }

  // SSLCommerz will post IPN notifications here
  @Post('ipn')
  @ApiExcludeEndpoint()
  async ipn(@Req() req: any) {
    const result = await this.paymentsService.onIpn(req.body);
    return { message: 'IPN received', data: result };
  }

  // Optional helpers
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Get('query-tran')
  @ApiOperation({ summary: 'Query a transaction by its ID' })
  @ApiOkResponse({ description: 'Transaction details' })
  async queryByTran(@Query('tran_id') tran_id: string) {
    const data = await this.paymentsService.queryByTranId(tran_id);
    return { message: 'Transaction query', data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Get('my-payments')
  @ApiOperation({ summary: "Get the current user's payments" })
  @ApiOkResponse({
    description: 'List of my payments',
    type: PaginationResponseDto,
  })
  async findMyPayments(
    @GetUser() user: User,
    @Query() paginationDto: PaginationPaymentDto,
  ): Promise<PaginationResponseDto<PaymentResponseDTO>> {
    return this.paymentsService.findMyPayments(user.id, paginationDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('/all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments (Admin only)' })
  @ApiOkResponse({
    description: 'List of all payments',
    type: PaginationResponseDto,
  })
  async findAll(
    @Query() paginationDto: PaginationPaymentDto,
  ): Promise<PaginationResponseDto<PaymentResponseDTO>> {
    return this.paymentsService.findAll(paginationDto);
  }
}
