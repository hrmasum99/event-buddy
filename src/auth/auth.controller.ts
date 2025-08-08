import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';
import { UserResponseDTO } from 'src/users/dto/user-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserWithMessageResponseDTO } from 'src/interceptors/dto/UserWithMessageResponseDTO';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiCreatedResponse({
    description: 'User registered successfully',
    type: UserResponseDTO,
  })
  @ApiBadRequestResponse({ description: 'Invalid registration data' })
  async signUp(
    @Body() registerDto: RegisterDTO,
  ): Promise<UserWithMessageResponseDTO> {
    return this.authService.register(registerDto);
  }

  @Post('signin')
  @ApiOkResponse({ description: 'User signed in successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async signIn(@Body() loginDto: LoginDTO) {
    const token = await this.authService.signIn(loginDto);
    if (!token) throw new UnauthorizedException('Invalid credentials');
    return token;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOkResponse({ description: 'User logged out successfully' })
  async logout(@Req() req: Request) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.authService.logout(token);
  }
}
