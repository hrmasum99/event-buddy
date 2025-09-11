import { ApiProperty } from '@nestjs/swagger';

export class BookingResponseDTO {
  @ApiProperty({ example: 1, description: 'Unique booking ID' })
  id: number;

  @ApiProperty({ example: 2, description: 'Number of seats booked' })
  seatsBooked: number;
  quantity: number;
  eventTitle: string;
  unitPrice: string;
  totalPaid: string;
  createdAt: Date;
}
