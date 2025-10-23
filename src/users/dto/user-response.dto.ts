import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDTO {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'SM Deep' })
  fullname: string;

  @ApiProperty({ example: 'smdeep@example.com' })
  email: string;

  @ApiProperty({
    example: 'user',
    description: 'Role of the user (admin/user)',
  })
  role: string;
  @ApiProperty({ example: '' })
  isTwoFactorEnabled?: boolean;
}

export class PassResponseDTO {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'User#123' })
  password: string;

  @ApiProperty({ example: '' })
  twoFactorSecret?: string;
  isTwoFactorEnabled?: boolean;

  fullname?: string;
  role?: string;
}
