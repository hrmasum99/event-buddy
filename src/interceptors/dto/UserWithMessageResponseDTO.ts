import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDTO } from 'src/users/dto/user-response.dto';

export class UserWithMessageResponseDTO {
  @ApiProperty({ example: 'User registered successfully' })
  message: string;

  @ApiProperty({ type: () => UserResponseDTO })
  data: UserResponseDTO;
}
