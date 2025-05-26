import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./users.entity";
import { UsersService } from "./users.service";
import { UserController } from "./users.controller";
import { AuthModule } from "src/auth/auth.module";
import { EventsModule } from "src/events/events.module";

@Module({
  imports: [TypeOrmModule.forFeature([User]), 
  forwardRef(() => AuthModule,),
  EventsModule,
  ],
  providers: [UsersService],
  controllers: [UserController],
  exports: [UsersService],
})
export class UsersModule {}
