import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Role } from 'src/common/enums/role.enum';
import { Booking } from 'src/bookings/bookings.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty({ description: 'Unique identifier for the user', example: 10 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Full name of the user', example: 'MD Nishat' })
  @Column()
  fullname: string;

  @ApiProperty({ description: 'Email address of the user', example: 'nishat@example.com' })
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @ApiProperty({ enum: Role, description: 'Role assigned to the user', example: Role.User })
  @Column({ type: 'enum', enum: Role, default: Role.User })
  role: Role;

  @OneToMany(() => Booking, booking => booking.user)
  bookings: Booking[];

}