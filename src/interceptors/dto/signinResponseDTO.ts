import { ApiProperty } from '@nestjs/swagger';
import { LoginDTO } from 'src/auth/dto/login.dto';

export class SigninResponseDTO {
  @ApiProperty({ example: 'Login successful' })
  message: string;

  @ApiProperty({ type: () => LoginDTO })
  data: LoginDTO;
}
