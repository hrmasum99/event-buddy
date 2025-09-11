import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEntity } from 'src/events/entities/events.entity';
import { User } from 'src/users/users.entity';
import { Refund, RefundStatus } from './refund.entity';
import { PaymentsService } from 'src/payments/payments.service';
import { RefundResponseDto } from './dto/refunds-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class RefundsService {
  constructor(
    @InjectRepository(Refund)
    private refundsRepo: Repository<Refund>,

    @InjectRepository(EventEntity)
    private eventsRepo: Repository<EventEntity>,

    private readonly paymentsService: PaymentsService,
  ) {}

  async getAllRefunds(filterDto: any) {
    const query = this.refundsRepo
      .createQueryBuilder('refund')
      .leftJoinAndSelect('refund.event', 'event')
      .leftJoinAndSelect('refund.user', 'user')
      .leftJoinAndSelect('refund.admin', 'admin');

    if (filterDto.reason) {
      query.andWhere('refund.reason = :reason', { reason: filterDto.reason });
    }

    if (filterDto.status) {
      query.andWhere('refund.status = :status', { status: filterDto.status });
    }

    return await query.getMany();
  }

  async findAll(): Promise<Refund[]> {
    return this.refundsRepo.find({
      relations: ['booking', 'event', 'user', 'admin'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Refund> {
    const refund = await this.refundsRepo.findOne({
      where: { id },
      relations: ['booking', 'event', 'user', 'admin'],
    });
    if (!refund) throw new NotFoundException(`Refund ID ${id} not found`);
    return refund;
  }

  async approveRefund(
    refundId: number,
    status: RefundStatus,
    admin: User,
    note?: string,
  ): Promise<RefundResponseDto> {
    const refund = await this.findOne(refundId);
    if (!refund) throw new NotFoundException(`Refund ID ${refundId} not found`);

    if (refund.status !== RefundStatus.PENDING) {
      throw new BadRequestException('Refund already processed');
    }

    // const bank_tran_id = refund.booking.payment?.tranId;

    const event = await this.eventsRepo.findOne({
      where: { id: refund.event.id },
    });
    if (!event) throw new NotFoundException('Event not found for refund');

    const now = new Date();
    const eventDate = new Date(event.date);
    const refundCreated = new Date(refund.createdAt);

    const timeUntilEvent = eventDate.getTime() - now.getTime(); // ms
    const cancelBeforeEvent = eventDate.getTime() - refundCreated.getTime(); // ms

    // --- Eligibility check ---
    if (
      timeUntilEvent < 24 * 60 * 60 * 1000 &&
      cancelBeforeEvent < 24 * 60 * 60 * 1000
    ) {
      throw new BadRequestException(
        'Refund not allowed within 24 hours of event start',
      );
    }

    // --- Mark refund processed ---
    refund.status = status;
    refund.admin = admin;
    refund.adminName = admin.fullname;
    refund.adminEmail = admin.email;
    refund.adminNote = note;

    if (status === RefundStatus.APPROVED) {
      const bank_tran_id = refund.booking.payment?.tranId;
      if (!bank_tran_id) {
        throw new BadRequestException('Original transaction not found');
      }

      const res = await this.paymentsService.refund(
        bank_tran_id,
        refund.amount,
        note || 'Approved',
      );
      if (!res) {
        throw new BadRequestException(
          `Failed to process refund with gateway: ${res?.errorReason || 'Unknown error'}`,
        );
      }

      refund.refundRefId = res.refund_ref_id || null;
      // --- Deduct revenue if successful ---
      const currentRevenue = Number(event.totalRevenue || 0);
      event.totalRevenue = (currentRevenue - Number(refund.amount)).toFixed(2);
      await this.eventsRepo.save(event);
    }

    // return await this.refundsRepo.save(refund);

    const saved = await this.refundsRepo.save(refund);

    // ✅ Map to DTO and strip unwanted fields
    return plainToInstance(RefundResponseDto, {
      ...saved,
      booking: {
        id: saved.booking.id,
        eventTitle: saved.booking.eventTitle,
        totalPaid: saved.booking.totalPaid,
        status: saved.booking.status,
      },
      event: {
        id: saved.event.id,
        title: saved.event.title,
        date: saved.event.date,
        location: saved.event.location,
        ticketPrice: saved.event.ticketPrice,
      },
      user: {
        id: saved.user.id,
        fullname: saved.user.fullname,
        email: saved.user.email,
      },
      admin: saved.admin
        ? {
            id: saved.admin.id,
            fullname: saved.admin.fullname,
            email: saved.admin.email,
            role: saved.admin.role,
          }
        : null,
    });
  }

  async rejectRefund(refundId: number, admin: User, note?: string) {
    const refund = await this.refundsRepo.findOne({ where: { id: refundId } });
    if (!refund) throw new NotFoundException(`Refund ID ${refundId} not found`);
    if (refund.status !== RefundStatus.PENDING) {
      throw new BadRequestException('Refund already processed');
    }

    refund.status = RefundStatus.REJECTED;
    refund.admin = admin;
    refund.adminName = admin.fullname;
    refund.adminEmail = admin.email;
    refund.adminNote = note || 'Rejected';
    await this.refundsRepo.save(refund);

    return { success: true, message: `Refund rejected by ${admin.fullname}` };
  }
}
