import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/bookings.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { User } from 'src/users/users.entity';
import { EventEntity } from 'src/events/entities/events.entity';
import { AuthModule } from 'src/auth/auth.module';
import { PaymentsModule } from 'src/payments/payments.module';
import { Payment } from 'src/payments/entities/payment.entity';
import { CancelLog } from './entities/cancel-log.entity';
import { Refund } from 'src/refunds/refund.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      User,
      EventEntity,
      CancelLog,
      Refund,
      Payment,
    ]),
    AuthModule,
    PaymentsModule,
  ],
  providers: [BookingsService],
  controllers: [BookingsController],
})
export class BookingsModule {}
