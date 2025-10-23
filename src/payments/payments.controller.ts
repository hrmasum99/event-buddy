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
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginationPaymentDto } from './dto/pagination-payment.dto';
import { PaymentResponseDTO } from './dto/payment-response.dto';
import { Request, Response } from 'express';

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
      dto.bookingId, // ✅ FIX: Use the bookingId from the DTO payload
      dto,
    );
    return { message: 'Redirect to gateway', data: { gatewayUrl, tranId } };
  }
  // async initiate(@GetUser() user: User, @Body() dto: InitiatePaymentDTO) {
  //   const { gatewayUrl, tranId } = await this.paymentsService.initiate(
  //     user.id,
  //     dto,
  //   );
  //   return { message: 'Redirect to gateway', data: { gatewayUrl, tranId } };
  // }

  // Handle SSLCommerz redirect (user browser redirect)
  // @Get('success')
  // @ApiExcludeEndpoint()
  // async successGet(@Query() query: any) {
  //   const result = await this.paymentsService.onSuccess(query);
  //   return { message: 'Payment success (GET)', data: result };
  // }
  @Get('on-success')
  async paymentSuccess(@Query() query: any, @Res() res: Response) {
    const { tran_id } = query;
    // ✅ Redirect to frontend page with tran_id
    return res.redirect(
      `http://localhost:3000/payments/success?tran_id=${tran_id}`,
    );
  }

  // Handle SSLCommerz server-to-server POST
  // @Post('success')
  // @ApiExcludeEndpoint()
  // async successPost(@Body() body: any, @Query() query: any) {
  //   const data = { ...query, ...body }; // merge both
  //   const result = await this.paymentsService.onSuccess(data);
  //   return { message: 'Payment success (POST)', data: result };
  // }

  @Post('success')
  @ApiExcludeEndpoint()
  async successPost(@Req() req: Request, @Res() res: Response) {
    try {
      // Fix: TypeScript doesn't know `req.query` is object, so cast it
      const query = req.query as Record<string, any>;
      const body = req.body as Record<string, any>;

      // merge both
      const data = { ...query, ...body };

      // call service
      const result: {
        message: string;
        tranId: string;
        valId: string;
        invoiceUrl: string;
        ticketUrl: string;
      } = await this.paymentsService.onSuccess(data);

      const tran_id = data.tran_id || data.tranId || result.tranId;

      if (tran_id) {
        const frontendSuccessUrl = `http://localhost:3000/payments/success?tran_id=${encodeURIComponent(
          tran_id,
        )}`;
        return res.redirect(frontendSuccessUrl);
      }

      return res.status(HttpStatus.OK).json({
        message: 'Payment processed (POST)',
        result,
      });
    } catch (err: any) {
      console.error('Error in POST /payments/success:', err?.message || err);
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: err?.message || 'Payment processing failed',
        error: true,
      });
    }
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

  @Get('on-fail')
  async paymentFail(@Query() query: any, @Res() res: Response) {
    const { tran_id } = query;
    // ✅ Redirect to frontend failure page
    return res.redirect(
      `http://localhost:3000/payments/fail?tran_id=${tran_id}`,
    );
  }

  @Get('on-cancel')
  async paymentCancel(@Query() query: any, @Res() res: Response) {
    const { tran_id } = query;
    // Optional cancel page
    return res.redirect(
      `http://localhost:3000/payments/cancel?tran_id=${tran_id}`,
    );
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
  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.User)
  // @Get('query-tran')
  // @ApiOperation({ summary: 'Query a transaction by its ID' })
  // @ApiOkResponse({ description: 'Transaction details' })
  // async queryByTran(@Query('tran_id') tran_id: string) {
  //   const data = await this.paymentsService.queryByTranId(tran_id);
  //   return { message: 'Transaction query', data };
  // }

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
    // 1️⃣ Query SSLCommerz API
    const sslResponse = await this.paymentsService.queryByTranId(tran_id);

    if (!sslResponse?.element?.[0]) {
      return {
        success: false,
        message: 'Transaction not found in SSLCommerz',
        data: null,
      };
    }

    // 2️⃣ Get your internal payment record
    const payment = await this.paymentsService.findByTranId(tran_id);

    if (!payment) {
      return {
        success: false,
        message: 'Payment not found in database',
        data: sslResponse,
      };
    }

    // 3️⃣ Get related booking details
    const booking = await this.paymentsService.findBookingByPayment(payment.id);

    // 4️⃣ Build structured response
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
