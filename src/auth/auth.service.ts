import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';
import { UserResponseDTO } from 'src/users/dto/user-response.dto';


@Injectable()
export class AuthService {
  constructor(
      private readonly usersService: UsersService,
      private readonly jwtService: JwtService,
  ) {}
  private blacklistedTokens = new Set<string>();

  async register(registerDto: RegisterDTO): Promise<UserResponseDTO> {
    const { email, password } = registerDto;

    const checkUser = await this.usersService.findByEmail(email);
    if (checkUser) {
        throw new ConflictException('Email already exists!');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    registerDto.password =  hashedPassword;

    return await this.usersService.createUser(registerDto);
  }

  async signIn(loginDto: LoginDTO) {
    const checkUser = await this.usersService.findByCredentials(loginDto);
 
    if (!checkUser) {
      throw new NotFoundException(`User with email '${loginDto.email}' not found.`);
    }
  
    if (!(await bcrypt.compare(loginDto.password, checkUser.password))) {
      throw new UnauthorizedException('Invalid password.');
    }

    const payload = { sub: checkUser.id, fullname: checkUser.fullname, email: checkUser.email, role: checkUser.role, };
    return {
        access_token: this.jwtService.sign(payload),
    };
  }

  logout(token: string) {
    this.blacklistedTokens.add(token);
    return { message: 'Logout successful' };
  }

  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }
}
