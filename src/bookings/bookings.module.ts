import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Booking } from "./bookings.entity";
import { BookingsService } from "./bookings.service";
import { BookingsController } from "./bookings.controller";
import { User } from "src/users/users.entity";
import { EventEntity } from "src/events/events.entity";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([Booking, User, EventEntity]),
  AuthModule,
  ],
  providers: [BookingsService],
  controllers: [BookingsController],
})
export class BookingsModule {}