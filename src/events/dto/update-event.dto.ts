import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateEventDTO {
  @ApiPropertyOptional({ example: 'New Event Title' })
  @IsOptional()
  @IsString({ message: 'Please enter a valid title of the event' })
  @IsNotEmpty({ message: 'Title is required' })
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description for the event.' })
  @IsOptional()
  @IsString({ message: 'Please enter a valid description' })
  @IsNotEmpty({ message: 'Description is required' })
  description?: string;

  @ApiPropertyOptional({ example: '2025-11-20T10:00:00Z' })
  @IsOptional()
  date?: Date;

  @ApiPropertyOptional({ example: 'Chicago' })
  @IsOptional()
  @IsString({ message: 'Please enter a valid location' })
  @IsNotEmpty({ message: 'Location is required' })
  location?: string;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber({}, { message: 'Total seats must be a number' })
  @Min(1, { message: 'Total seats must be at least 1' })
  totalSeats?: number;

  @ApiPropertyOptional({ example: 'AI, Robotics' })
  @IsOptional()
  @IsString({ message: 'Tags must be a comma-separated string' })
  @IsNotEmpty({ message: 'Tags are required' })
  tags?: string;

}

export class UploadImageDTO {
  @ApiProperty({ example: 'event-image.png', description: 'Uploaded image filename' })
  file: string;
}

