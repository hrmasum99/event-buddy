import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { UserResponseDTO } from './dto/user-response.dto';
import { RegisterDTO } from 'src/auth/dto/register.dto';
import { LoginDTO } from 'src/auth/dto/login.dto';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(): Promise<UserResponseDTO[]> {
    return this.userRepo.find();
  }

  async findById(userId: number): Promise<UserResponseDTO> {
    return await this.userRepo.findOne({
      where: { id: userId },
    });
  }

  async findByEmail(email: string): Promise<UserResponseDTO> {
    return this.userRepo.findOne({ where: { email } });
  }

  async createUser(registerDto: RegisterDTO): Promise<UserResponseDTO> {
    const { fullname, email, password, role } = registerDto;

    const user = new User();
    user.fullname = fullname;
    user.email = email;
    user.password = password;
    user.role = (role as Role) || Role.User;

    return await this.userRepo.save(user);
  }

  async findByCredentials(loginDto: LoginDTO): Promise<RegisterDTO> {
    return this.userRepo.findOne({ where: { email: loginDto.email } });
  }
}
