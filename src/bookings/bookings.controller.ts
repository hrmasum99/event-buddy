import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { BookingsService } from "./bookings.service";
import { BookingResponseDTO } from "./dto/booking-response.dto";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorators";
import { Role } from "src/common/enums/role.enum";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { CreateBookingDTO } from "./dto/create-booking.dto";
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('/available-seats/:id')
  @ApiOkResponse({ description: 'Number of available seats returned' })
  async getAvailableSeats(@Param('id') id: number): Promise<{ availableSeats: number }> {
    const availableSeats = await this.bookingsService.getAvailableSeats(id);
    return {availableSeats};
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Get('/my-bookings')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'List of user bookings', type: [BookingResponseDTO] })
  async findAll(@GetUser() user: any): Promise<BookingResponseDTO[]> {
    return this.bookingsService.findAll(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post('/new-booking/:eventId')
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Booking created successfully', type: BookingResponseDTO })
  @ApiBadRequestResponse({ description: 'Booking failed' })
  async newBooking(
    @Param('eventId') eventId: number,
    @Body() seatsBooked: CreateBookingDTO,
    @GetUser() user: any
  ): Promise<BookingResponseDTO> {
    return this.bookingsService.newBooking(user.id, eventId, seatsBooked);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete('/cancel-booking/:id')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Booking cancelled successfully' })
  async cancelBooking(@Param('id') id: number): Promise<void> {
    return this.bookingsService.cancelBooking(id);
  }
}