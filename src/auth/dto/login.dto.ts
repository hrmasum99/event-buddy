import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, Matches, MinLength } from 'class-validator';

export class LoginDTO {
  @ApiProperty({ example: 'user@example.com', description: 'Valid email address of the user' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @Matches(/^[^@]+@[^@]+\.com$/, { message: 'Email must be in the format user@domain.com' })
  email: string;

  @ApiProperty({ example: 'Password@123', description: 'Password (min 8 characters)' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}
