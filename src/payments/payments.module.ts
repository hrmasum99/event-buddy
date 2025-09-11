import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './entities/payment.entity';
import { Coupon } from '../events/entities/coupon.entity';
import { EventEntity } from 'src/events/entities/events.entity';
import { User } from 'src/users/users.entity';
import { Booking } from 'src/bookings/entities/bookings.entity';
import { DocumentsModule } from 'src/documents/documents.module';
import { Invoice } from 'src/documents/entities/invoices.entity';
import { Ticket } from 'src/documents/entities/tickets.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { PdfService } from 'src/common/pdf/pdf.service';
import { AuthModule } from 'src/auth/auth.module';
import { EventsService } from 'src/events/events.service';

// @Module({
//   imports: [
//     ConfigModule,
//     TypeOrmModule.forFeature([Payment, Coupon, EventEntity, User, Booking]),
//     forwardRef(() => AuthModule),
//     // If you want to reuse seat availability checks, import BookingsModule or EventsService
//   ],
//   controllers: [PaymentsController],
//   providers: [PaymentsService],
//   exports: [PaymentsService],
// })

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Booking,
      Coupon,
      EventEntity,
      User,
      Invoice,
      Ticket,
    ]),
    forwardRef(() => AuthModule),
    DocumentsModule,
    CloudinaryModule,
  ],
  providers: [PaymentsService, PdfService, EventsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
