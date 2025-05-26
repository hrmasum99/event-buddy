import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateEventDTO {
  @ApiProperty({ example: 'Tech Conference 2025', description: 'Title of the event' })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Please enter a valid title of the event' })
  title: string;

  @ApiProperty({ example: 'A technology conference covering AI, ML, and more.', description: 'Description of the event' })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Please enter a valid description' })
  description: string;

  @ApiProperty({ example: '2025-10-01T14:00:00Z', description: 'Date and time of the event in ISO format' })
  @IsNotEmpty({ message: 'Date is required and should be ISO format' })
  date: Date;

  @ApiProperty({ example: 'New York City', description: 'Location of the event' })
  @IsNotEmpty({ message: 'Location is required' })
  @IsString({ message: 'Please enter a valid location' })
  location: string;

  @ApiProperty({ example: 150, description: 'Total available seats' })
  @IsNotEmpty({ message: 'Totalseat is required' })
  @IsNumber({}, { message: 'Total seats must be a number' })
  @Min(1, { message: 'Total seats must be at least 1' })
  totalSeats: number;

  @ApiProperty({ example: 'Tech, AI, Cloud', description: 'Tags for the event' })
  @IsNotEmpty({ message: 'Tags are required' })
  @IsString({ message: 'Tags must be a comma-separated string' })
  tags: string;

  @IsOptional()
  file?: string;
}