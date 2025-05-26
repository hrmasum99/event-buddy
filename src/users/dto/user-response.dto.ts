import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDTO {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'SM Deep' })
  fullname: string;

  @ApiProperty({ example: 'smdeep@example.com' })
  email: string;

  @ApiProperty({ example: 'user', description: 'Role of the user (admin/user)' })
  role: string;
}