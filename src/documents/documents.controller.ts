import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  Query,
  UseGuards,
} from '@nestjs/common';
// import { PdfService } from '../common/pdf/pdf.service';
// import { MailerService } from '../common/mailer/mailer.service';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from 'src/common/enums/role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from './entities/invoices.entity';
import { Ticket } from './entities/tickets.entity';
import { Repository } from 'typeorm';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserResponseDTO } from 'src/users/dto/user-response.dto';
import axios from 'axios';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(
    // private readonly pdfService: PdfService,
    // private readonly mailerService: MailerService,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
  ) {}

  private async fetchFileFromUrl(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }
  // // OPTION 1: Send by Email
  // @Roles(Role.User)
  // @Post('send-invoice-and-ticket')
  // async sendInvoiceAndTicket(
  //   @Body() body: { email: string; fullname: string },
  // ) {
  //   const order = { id: 'INV-1001', customer: body.fullname, amount: 250 };
  //   const event = {
  //     id: 1,
  //     title: 'Music Fest 2025',
  //     date: '2025-10-01',
  //     location: 'Dhaka',
  //     backgroundUrl: 'url',
  //   };

  //   const invoicePdf = await this.pdfService.generateInvoiceBuffer(order);
  //   const ticketPdf = await this.pdfService.generateTicketBuffer(event, body);

  //   await this.mailerService.sendMail(
  //     body.email,
  //     'Your Invoice',
  //     'Attached is your invoice.',
  //     invoicePdf,
  //     'invoice.pdf',
  //   );
  //   await this.mailerService.sendMail(
  //     body.email,
  //     'Your Event Ticket',
  //     'Attached is your event ticket.',
  //     ticketPdf,
  //     'ticket.pdf',
  //   );

  //   return { message: 'Invoice and Ticket sent to email successfully' };
  // }

  // Download Invoice (from Cloudinary URL saved in DB)
  @Get('invoice/:id')
  @ApiOperation({ summary: 'Download an invoice as a PDF file' })
  @ApiOkResponse({ description: 'Invoice PDF file' })
  @ApiNotFoundResponse({ description: 'Invoice not found' })
  async downloadInvoice(@Param('id') id: number, @Res() res: Response) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // // Option 1: Redirect user directly to Cloudinary file
    // return res.redirect(invoice.fileUrl);

    // ---- OR ----
    // Option 2: Stream file content to client

    // ---------- Fetch PDFs back from Cloudinary ----------
    const invoiceBufferURL = await this.fetchFileFromUrl(invoice.url);

    // const response = await fetch(invoice.url);
    // const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=INV-${invoice.payment.eventTitle}${id}.pdf`,
    );
    res.end(invoiceBufferURL);
  }

  // Download Ticket (from Cloudinary URL saved in DB)
  @Get('ticket/:id')
  @ApiOperation({ summary: 'Download a ticket as a PDF file' })
  @ApiOkResponse({ description: 'Ticket PDF file' })
  @ApiNotFoundResponse({ description: 'Ticket not found' })
  async downloadTicket(@Param('id') id: number, @Res() res: Response) {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // // Option 1: Redirect user directly to Cloudinary file
    // return res.redirect(ticket.fileUrl);

    // ---- OR ----
    // Option 2: Stream file content

    // ---------- Fetch PDFs back from Cloudinary ----------
    const ticketBufferURL = await this.fetchFileFromUrl(ticket.url);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=TKT-${ticket.event.title}${id}.pdf`,
    );
    res.end(ticketBufferURL);
  }

  // GET all invoices (admin)
  @Roles(Role.Admin)
  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices (Admin only)' })
  @ApiOkResponse({ description: 'A list of all invoices' })
  async getAllInvoices(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('eventTitle') eventTitle?: string,
  ) {
    const qb = this.invoiceRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.payment', 'payment')
      .leftJoinAndSelect('payment.event', 'event')
      .leftJoinAndSelect('invoice.user', 'user');

    if (from) qb.andWhere('invoice.createdAt >= :from', { from });
    if (to) qb.andWhere('invoice.createdAt <= :to', { to });
    if (eventTitle)
      qb.andWhere('event.title ILIKE :eventTitle', {
        eventTitle: `%${eventTitle}%`,
      });

    return qb.getMany();
  }

  // GET all tickets (admin)
  @Roles(Role.Admin)
  @Get('tickets')
  @ApiOperation({ summary: 'Get all tickets (Admin only)' })
  @ApiOkResponse({ description: 'A list of all tickets' })
  async getAllTickets(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('eventTitle') eventTitle?: string,
  ) {
    const qb = this.ticketRepo
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.event', 'event')
      .leftJoinAndSelect('ticket.user', 'user');

    if (from) qb.andWhere('ticket.createdAt >= :from', { from });
    if (to) qb.andWhere('ticket.createdAt <= :to', { to });
    if (eventTitle)
      qb.andWhere('event.title ILIKE :eventTitle', {
        eventTitle: `%${eventTitle}%`,
      });

    return qb.getMany();
  }

  // GET My Invoices with date filter
  @Roles(Role.User)
  @Get('my-invoices')
  @ApiOperation({ summary: "Get the current user's invoices" })
  @ApiOkResponse({ description: 'A list of the current user\'s invoices' })
  async getMyInvoices(
    @GetUser() user: UserResponseDTO,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const qb = this.invoiceRepo
      .createQueryBuilder('invoice')
      .where('invoice.userId = :id', { id: user.id });

    if (from) qb.andWhere('invoice.createdAt >= :from', { from });
    if (to) qb.andWhere('invoice.createdAt <= :to', { to });

    return qb.getMany();
  }

  // GET My Tickets with date filter
  @Roles(Role.User)
  @Get('my-tickets')
  @ApiOperation({ summary: "Get the current user's tickets" })
  @ApiOkResponse({ description: 'A list of the current user\'s tickets' })
  async getMyTickets(
    @GetUser() user: UserResponseDTO,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const qb = this.ticketRepo
      .createQueryBuilder('ticket')
      .where('ticket.userId = :id', { id: user.id });

    if (from) qb.andWhere('ticket.createdAt >= :from', { from });
    if (to) qb.andWhere('ticket.createdAt <= :to', { to });

    return qb.getMany();
  }
}
