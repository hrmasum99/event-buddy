import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';
import { UserResponseDTO } from 'src/users/dto/user-response.dto';
import { UserWithMessageResponseDTO } from 'src/interceptors/dto/UserWithMessageResponseDTO';
import { MailerService } from '@nestjs-modules/mailer';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class AuthService {
  private otpStore = new Map<string, { otp: string; expires: Date }>();
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private mailerService: MailerService,
  ) {}
  private blacklistedTokens = new Set<string>();

  async register(
    registerDto: RegisterDTO,
  ): Promise<UserWithMessageResponseDTO> {
    const { email, password } = registerDto;

    const checkUser = await this.usersService.findByEmail(email);
    if (checkUser) {
      throw new ConflictException('Email already exists!');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    registerDto.password = hashedPassword;

    // return await this.usersService.createUser(registerDto);
    const newUser = await this.usersService.createUser(registerDto);

    return {
      message: 'User registered successfully',
      data: newUser,
    };
  }

  // async signIn(loginDto: LoginDTO): Promise<{
  //   requires2FA: boolean;
  //   message?: string;
  //   data?: object;
  //   access_token?: string;
  // }> {
  //   const checkUser = await this.usersService.findByCredentials(loginDto);

  //   if (!checkUser) {
  //     throw new NotFoundException(
  //       `User with email '${loginDto.email}' not found.`,
  //     );
  //   }

  //   if (!(await bcrypt.compare(loginDto.password, checkUser.password))) {
  //     throw new UnauthorizedException('Invalid password.');
  //   }

  //   const payload = {
  //     sub: checkUser.id,
  //     fullname: checkUser.fullname,
  //     email: checkUser.email,
  //     role: checkUser.role,
  //   };

  //   if (user.twoFASecret) {
  //     // Step 1 success, now require 2FA
  //     return { requires2FA: true };
  //   }

  //   // No 2FA enabled, return JWT directly
  //   const token = this.jwtService.sign({
  //     sub: user.id,
  //     username: user.username,
  //   });
  //   return { requires2FA: false, token };
  //   // return {
  //   //   access_token: this.jwtService.sign(payload),
  //   // };

  //   return {
  //     message: 'Login successful',
  //     data: {
  //       access_token: this.jwtService.sign(payload),
  //     },
  //   };
  // }

  // 🔹 Login Step 1: Verify email + password
  async signIn(loginDto: LoginDTO) {
    const user = await this.usersService.findByEmailForPass(loginDto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    // if 2FA is enabled → ask for OTP
    if (user.twoFactorSecret) {
      return { twoFactorRequired: true, message: 'Enter 2FA code' };
    }

    // else return token
    // const payload = { sub: user.id, email: user.email };
    const payload = {
      sub: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    };
    return {
      message: 'Login successful',
      data: {
        access_token: this.jwtService.sign(payload),
      },
    };
  }

  // 🔹 Login Step 2: Verify 2FA
  async generate2FASecret(
    email: string,
  ): Promise<{ otpauthUrl: string; qrCode: string }> {
    const user = await this.usersService.findByEmailForPass(email);
    if (!user) throw new UnauthorizedException('User not found');

    const secret = speakeasy.generateSecret({
      name: `EventBuddy (${user.email})`,
    });

    // save secret and mark 2FA enabled
    user.twoFactorSecret = secret.base32;
    user.isTwoFactorEnabled = true;
    await this.usersService.updateUserPass(
      user.id,
      user.password,
      user.twoFactorSecret,
      user.isTwoFactorEnabled,
    );

    const qrCode = await qrcode.toDataURL(secret.otpauth_url);
    return { otpauthUrl: secret.otpauth_url, qrCode };
  }

  async verifyTwoFactorCode(email: string, code: string) {
    const user = await this.usersService.findByEmailForPass(email);
    if (!user || !user.twoFactorSecret)
      throw new UnauthorizedException('2FA not set up for this user');

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // nothing else to save, already enabled at setup
    return { success: true, message: '2FA verified successfully' };
  }

  logout(token: string) {
    this.blacklistedTokens.add(token);
    return { message: 'Logout successful' };
  }

  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  // Step 1: Send OTP
  async sendOtp(email: string) {
    const checkUser = await this.usersService.findByEmail(email);
    if (!checkUser) throw new BadRequestException('Email not registered');

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    this.otpStore.set(email, { otp, expires });

    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    });

    return { message: 'OTP sent successfully' };
  }

  // Step 2: Verify OTP
  async verifyOtp(email: string, otp: string) {
    const entry = this.otpStore.get(email);
    if (!entry) throw new BadRequestException('No OTP requested');

    if (entry.expires < new Date()) {
      this.otpStore.delete(email);
      throw new BadRequestException('OTP expired');
    }

    if (entry.otp !== otp) throw new UnauthorizedException('Invalid OTP');

    return { message: 'OTP verified successfully' };
  }

  // Step 3: Reset Password
  async resetPassword(email: string, newPassword: string) {
    const user = await this.usersService.findByEmailForPass(email);
    if (!user) throw new BadRequestException('Email not registered');

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame)
      throw new BadRequestException(
        'New password cannot be same as the old password',
      );

    const salt = await bcrypt.genSalt();
    const hashed = await bcrypt.hash(newPassword, salt);
    user.password = hashed;

    const newUser = await this.usersService.updateUserPass(
      user.id,
      user.password,
    );

    // return {
    //   message: 'User password reset successfully',
    //   data: newUser,
    // };

    // await this.userRepo.save(user);

    this.otpStore.delete(email);

    return { message: 'Password reset successful' };
  }

  // Change password (when logged in)
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersService.findByIdForPass(userId);
    if (!user) throw new BadRequestException('User not found');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Old password is incorrect');

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame)
      throw new BadRequestException(
        'New password cannot be same as the old password',
      );

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);
    const newUser = await this.usersService.updateUserPass(
      user.id,
      user.password,
    );
    // await this.userRepo.save(user);

    return { message: 'Password changed successfully' };
  }

  // async generate2FASecret(
  //   email: string,
  // ): Promise<{ otpauthUrl: string; qrCode: string }> {
  //   const user = await this.usersService.findByEmailForPass(email);
  //   if (!user) throw new UnauthorizedException('User not found');

  //   const secret = speakeasy.generateSecret({
  //     name: `EventBuddy (${user.email})`, // App name inside Google Authenticator
  //   });

  //   user.twoFactorSecret = secret.base32;
  //   await this.usersService.updateUserPass(user.id, user.password); // save secret only

  //   // Generate QR code from otpauth URL
  //   const qrCode = await qrcode.toDataURL(secret.otpauth_url);

  //   return { otpauthUrl: secret.otpauth_url, qrCode };
  // }
}
