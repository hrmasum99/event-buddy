import { ApiProperty } from "@nestjs/swagger";

export class EventResponseDTO {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Tech Conference 2025' })
  title: string;

  @ApiProperty({ example: 'An annual tech event with top speakers and workshops.' })
  description: string;

  @ApiProperty({ example: '2025-10-01T14:00:00Z' })
  date: Date;

  @ApiProperty({ example: 'San Francisco' })
  location: string;

  @ApiProperty({ example: 150 })
  totalSeats: number;

  @ApiProperty({ example: 'Tech, Startup, Innovation' })
  tags: string;

  @ApiProperty({ example: '1694352486event.png' })
  file: string;
}
