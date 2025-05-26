import { ApiProperty } from "@nestjs/swagger";
import { EventResponseDTO } from "src/events/dto/event-response.dto";
import { UserResponseDTO } from "src/users/dto/user-response.dto";

export class BookingResponseDTO {
  @ApiProperty({ example: 1, description: 'Unique booking ID' })
  id: number;

  @ApiProperty({ type: () => UserResponseDTO })
  user: UserResponseDTO;

  @ApiProperty({ type: () => EventResponseDTO })
  event: EventResponseDTO;

  @ApiProperty({ example: 2, description: 'Number of seats booked' })
  seatsBooked: number;
}