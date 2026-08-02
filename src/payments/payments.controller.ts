import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
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
  ApiNotFoundResponse,
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
import { PaginationPaymentDto } from './dto/pagination-payment.dto';
import { PaymentResponseDTO } from './dto/payment-response.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a payment for a booking' })
  @ApiCreatedResponse({
    description: 'Booking initiated successfully',
    type: InitiatePaymentDTO,
  })
  @ApiBadRequestResponse({ description: 'Booking initiation failed' })
  @ApiOkResponse({ description: 'Returns Gateway URL and tranId' })
  async initiate(@GetUser() user: User, @Body() dto: InitiatePaymentDTO) {
    const { gatewayUrl, tranId } = await this.paymentsService.initiate(
      dto.bookingId,
      dto,
    );
    return { message: 'Redirect to gateway', data: { gatewayUrl, tranId } };
  }

  // ✅ HANDLES SSLCOMMERZ POST SUCCESS REDIRECT
  @Post('success')
  async handleSuccess(@Body() body: any, @Res() res: Response) {
    const frontendUrl =
      this.configService.get('FRONTEND_URL') ||
      'https://event-buddy-bd.vercel.app';
    await this.paymentsService.onSuccess(body);
    return res.redirect(
      `${frontendUrl}/payments/success?tran_id=${body.tran_id || ''}`,
    );
  }

  // ✅ HANDLES SSLCOMMERZ POST FAIL REDIRECT
  @Post('fail')
  async handleFail(@Body() body: any, @Res() res: Response) {
    const frontendUrl =
      this.configService.get('FRONTEND_URL') ||
      'https://event-buddy-bd.vercel.app';
    await this.paymentsService.onFail(body);
    return res.redirect(
      `${frontendUrl}/payments/fail?tran_id=${body.tran_id || ''}`,
    );
  }

  // ✅ HANDLES SSLCOMMERZ POST CANCEL REDIRECT
  @Post('cancel')
  async handleCancel(@Body() body: any, @Res() res: Response) {
    const frontendUrl =
      this.configService.get('FRONTEND_URL') ||
      'https://event-buddy-bd.vercel.app';
    await this.paymentsService.onCancel(body);
    return res.redirect(
      `${frontendUrl}/payments/fail?tran_id=${body.tran_id || ''}`,
    );
  }

  @Post('ipn')
  @ApiExcludeEndpoint()
  async ipn(@Body() body: any) {
    const result = await this.paymentsService.onIpn(body);
    return { message: 'IPN received', data: result };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Get('query-tran')
  @ApiOperation({
    summary:
      'Query a transaction by its ID and include event, user, and booking info',
  })
  @ApiOkResponse({
    description: 'Transaction details with event, user, and booking info',
  })
  async queryByTran(@Query('tran_id') tran_id: string) {
    const sslResponse = await this.paymentsService.queryByTranId(tran_id);

    if (!sslResponse?.element?.[0]) {
      return {
        success: false,
        message: 'Transaction not found in SSLCommerz',
        data: null,
      };
    }

    const payment = await this.paymentsService.findByTranId(tran_id);

    if (!payment) {
      return {
        success: false,
        message: 'Payment not found in database',
        data: sslResponse,
      };
    }

    const booking = await this.paymentsService.findBookingByPayment(payment.id);

    return {
      success: true,
      message: 'Transaction query successful',
      data: {
        sslcommerz: sslResponse.element[0],
        paymentStatus: payment.status,
        discount: payment.couponDiscount,
        couponCode: payment.couponCode,
        event: {
          title: payment.event?.title,
          date: payment.event?.date,
          location: payment.event?.location,
        },
        biller: {
          name: payment.user?.fullname,
          email: payment.user?.email,
        },
        booking: {
          id: booking?.id,
          numSeats: booking?.quantity,
          unitPrice: booking?.unitPrice,
          totalAmount: payment.amount,
        },
      },
    };
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/get-payment/:id')
  @ApiOkResponse({ description: 'Get payment by ID', type: PaymentResponseDTO })
  @ApiNotFoundResponse({ description: 'Payment not found' })
  getPaymentById(@Param('id') id: number): Promise<PaymentResponseDTO> {
    return this.paymentsService.getPaymentById(id);
  }
}
