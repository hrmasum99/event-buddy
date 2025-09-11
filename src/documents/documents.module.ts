import { forwardRef, Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { PdfService } from '../common/pdf/pdf.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoices.entity';
import { Ticket } from './entities/tickets.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Ticket]),
    forwardRef(() => AuthModule),
    CloudinaryModule,
  ],
  controllers: [DocumentsController],
  providers: [PdfService],
  exports: [PdfService],
})
export class DocumentsModule {}
