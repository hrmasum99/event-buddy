import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, IsEmail, MinLength, IsEnum, IsOptional } from 'class-validator';

export class RegisterDTO {
  @ApiProperty({ example: 'HR Masum', description: 'Full name of the user' })
  @IsNotEmpty({ message: 'User name is required' })
  @IsString({ message: 'Name must be a string' })
  @Matches(/^[A-Za-z\s]+$/, { message: 'Please enter a valid name' })
  fullname: string;

  @ApiProperty({ example: 'masum@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @Matches(/^[^@]+@[^@]+\.com$/, { message: 'Email must be in the format user@domain.com' })
  email: string;

  @ApiProperty({ example: 'Password@123', description: 'Password with minimum 8 characters' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiPropertyOptional({ example: 'admin', description: 'Role of the user (optional)' })
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ example: 1, description: 'User ID (optional)' })
  @IsOptional()
  id?: number;
}
