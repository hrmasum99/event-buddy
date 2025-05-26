import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNumber, Max, Min } from "class-validator";

export class CreateBookingDTO {
  @ApiProperty({ example: 2, description: 'Number of seats to book (1-4)' })
  @IsNotEmpty({ message: 'Seats booked is required' })
  @IsInt({ message: 'Seats booked must be an integer' })
  @Min(1, { message: 'At least one seat must be booked' })
  @Max(4, { message: 'A user cannot book more than 4 seats' })
  seatsBooked: number;
}