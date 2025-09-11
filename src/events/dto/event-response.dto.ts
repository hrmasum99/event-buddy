import { ApiProperty } from '@nestjs/swagger';

export class EventResponseDTO {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Tech Conference 2025' })
  title: string;

  @ApiProperty({
    example: 'An annual tech event with top speakers and workshops.',
  })
  description: string;

  @ApiProperty({ example: '2025-10-01T14:00:00Z' })
  date: Date;

  @ApiProperty({ example: 'San Francisco' })
  location: string;

  @ApiProperty({ example: 150 })
  totalSeats: number;

  @ApiProperty({ example: 'Tech, Startup, Innovation' })
  tags: string;

  @ApiProperty({ example: '1500' })
  ticketPrice: string;

  @ApiProperty({ example: '16520' })
  totalRevenue: string;

  @ApiProperty({ example: '' })
  imageUrl: string;

  // Store Cloudinary public_id for deletion/updates
  @ApiProperty({ example: '' })
  imagePublicId: string;
}

export class EventLimitedResponseDTO {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Tech Conference 2025' })
  title: string;

  @ApiProperty({
    example: 'An annual tech event with top speakers and workshops.',
  })
  description: string;

  @ApiProperty({ example: '2025-10-01T14:00:00Z' })
  date: Date;

  @ApiProperty({ example: 'San Francisco' })
  location: string;

  @ApiProperty({ example: 150 })
  totalSeats: number;

  @ApiProperty({ example: 'Tech, Startup, Innovation' })
  tags: string;

  @ApiProperty({ example: '1500' })
  ticketPrice: string;

  @ApiProperty({ example: '' })
  imageUrl: string;

  // Store Cloudinary public_id for deletion/updates
  @ApiProperty({ example: '' })
  imagePublicId: string;
}
