import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  UseGuards,
  Req,
  Put,
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
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserWithMessageResponseDTO } from 'src/interceptors/dto/UserWithMessageResponseDTO';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { VerifyOtpDTO } from './dto/verify-otp.dto';
import { ResetPasswordDTO } from './dto/reset-password.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/users/users.entity';
import { Enable2FADTO } from './dto/enable-2fa.dto';

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

  @Post('forgot-password')
  @ApiOperation({ summary: 'Send OTP to email for password reset' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async forgotPassword(@Body() dto: ForgotPasswordDTO) {
    return await this.authService.sendOtp(dto.email);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP before resetting password' })
  async verifyOtp(@Body() dto: VerifyOtpDTO) {
    return await this.authService.verifyOtp(dto.email, dto.otp);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with verified OTP' })
  async resetPassword(@Body() dto: ResetPasswordDTO) {
    return await this.authService.resetPassword(dto.email, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  @ApiOperation({
    summary: 'Change password (logged in, requires old password)',
  })
  async changePassword(
    @GetUser() user: User,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return await this.authService.changePassword(
      user.id,
      oldPassword,
      newPassword,
    );
  }

  @Post('2fa/setup')
  @ApiOperation({ summary: 'Enable 2FA and get QR Code' })
  async setup2FA(@Body() body: { email: string }) {
    return this.authService.generate2FASecret(body.email);
  }

  @Post('2fa/verify')
  @ApiOperation({ summary: 'Verify OTP code and confirm 2FA setup' })
  async verify2FA(@Body() dto: Enable2FADTO & { email: string }) {
    return this.authService.verifyTwoFactorCode(dto.email, dto.code);
  }
}
