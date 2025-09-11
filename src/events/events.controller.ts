import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Redirect,
  Res,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import {
  EventLimitedResponseDTO,
  EventResponseDTO,
} from './dto/event-response.dto';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorators';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/users/users.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginationResponseDto } from 'src/common/dto/pagination-response.dto';
import { CouponResponseDTO } from './dto/coupon-response.dto';
import { CreateCouponDTO } from './dto/create-coupon.dto';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('/')
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'List of all events',
    type: PaginationResponseDto,
  })
  findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginationResponseDto<EventResponseDTO>> {
    return this.eventsService.findAll(paginationDto);
  }

  @Get('/upcoming')
  @ApiOkResponse({
    description: 'Upcoming events list',
    type: PaginationResponseDto,
  })
  getUpcomingEvents(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginationResponseDto<EventResponseDTO>> {
    return this.eventsService.getUpcomingEvents(paginationDto);
  }

  @Get('/previous')
  @ApiOkResponse({
    description: 'Previous events list',
    type: PaginationResponseDto,
  })
  getPreviousEvents(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginationResponseDto<EventResponseDTO>> {
    return this.eventsService.getPreviousEvents(paginationDto);
  }

  @Get('/get-event/:id')
  @ApiOkResponse({ description: 'Get event by ID', type: EventResponseDTO })
  @ApiNotFoundResponse({ description: 'Event not found' })
  getEvent(@Param('id') id: number): Promise<EventResponseDTO> {
    return this.eventsService.getEvent(id);
  }

  // @Get('/getimage/:id')
  // @ApiOkResponse({ description: 'Image file returned' })
  //   async getImage(@Param('id') id: number, @Res() res): Promise<any> {
  //       const filename = await this.eventsService.getEventImage(id);

  //       return res.sendFile(filename, { root: './uploads' });
  // }

  @Get('/image/:id')
  @ApiOperation({ summary: 'Get event image (redirects to Cloudinary URL)' })
  @ApiOkResponse({ description: 'Redirects to image URL' })
  @ApiNotFoundResponse({ description: 'Event or image not found' })
  @Redirect()
  async getEventImage(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ url: string }> {
    const imageUrl = await this.eventsService.getEventImage(id);
    return { url: imageUrl };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('my-events')
  @ApiOkResponse({
    description: 'Events Created by admin',
    type: [EventResponseDTO],
  })
  @ApiBearerAuth()
  @Roles(Role.Admin)
  getMyEvents(@GetUser() user: User) {
    return this.eventsService.getMyEvents(user.id);
  }

  // @Get('test-cloudinary')
  // @ApiOperation({ summary: 'Test Cloudinary connection' })
  // async testCloudinary() {
  //   try {
  //     const result = await this.eventsService.testCloudinaryConnection();
  //     return { success: true, cloudName: result };
  //   } catch (error) {
  //     return { success: false, error: error.message };
  //   }
  // }

  //Coupon

  @Roles(Role.Admin)
  @Post('/create-coupon')
  @ApiCreatedResponse({
    description: 'Coupon created successfully',
    type: CouponResponseDTO,
  })
  @ApiBadRequestResponse({ description: 'Invalid coupon creation request' })
  async createCoupon(
    @Body() couponData: CreateCouponDTO,
  ): Promise<CouponResponseDTO> {
    return this.eventsService.createCoupon(couponData);
  }

  @Roles(Role.Admin)
  @Delete('/delete-coupon/:id')
  @ApiOkResponse({ description: 'Coupon deleted successfully' })
  async deleteCoupon(@Param('id') id: number): Promise<void> {
    return this.eventsService.deleteCoupon(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/get-coupon/:id')
  @ApiOkResponse({ description: 'Get coupon by ID', type: CouponResponseDTO })
  @ApiNotFoundResponse({ description: 'Coupon not found' })
  getCoupon(@Param('id') id: number): Promise<CouponResponseDTO> {
    return this.eventsService.getCoupon(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('/get-all-coupon')
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'List of all coupons',
    type: PaginationResponseDto,
  })
  findAllCoupon(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginationResponseDto<CouponResponseDTO>> {
    return this.eventsService.findAllCoupon(paginationDto);
  }
}
