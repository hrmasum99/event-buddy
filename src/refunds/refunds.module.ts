import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Refund } from './refund.entity';
import { Booking } from 'src/bookings/entities/bookings.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { RefundsService } from './refunds.service';
import { RefundsController } from './refunds.controller';
import { EventEntity } from 'src/events/entities/events.entity';
import { AuthModule } from 'src/auth/auth.module';
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Refund, Booking, Payment, EventEntity]),
    forwardRef(() => AuthModule),
    PaymentsModule,
  ],
  providers: [RefundsService],
  controllers: [RefundsController],
  exports: [RefundsService],
})
export class RefundsModule {}
