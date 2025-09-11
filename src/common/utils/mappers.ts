import { User } from 'src/users/users.entity';
import { EventEntity } from 'src/events/entities/events.entity';
import { Coupon } from 'src/events/entities/coupon.entity';
import { Payment } from 'src/payments/entities/payment.entity';

import { UserResponseDTO } from 'src/users/dto/user-response.dto';
import { EventResponseDTO } from 'src/events/dto/event-response.dto';
import { CouponResponseDTO } from 'src/events/dto/coupon-response.dto';
import { PaymentResponseDTO } from 'src/payments/dto/payment-response.dto';

// 🔹 User → DTO
export function toUserResponseDTO(user: User): UserResponseDTO {
  if (!user) return null;
  return {
    id: user.id,
    fullname: user.fullname,
    email: user.email,
    role: user.role,
  };
}

// 🔹 Event → DTO
export function toEventResponseDTO(event: EventEntity): EventResponseDTO {
  if (!event) return null;
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    date: event.date,
    totalSeats: event.totalSeats,
    ticketPrice: event.ticketPrice,
    tags: event.tags,
    totalRevenue: event.totalRevenue,
    imageUrl: event.imageUrl,
    imagePublicId: event.imagePublicId,
  };
}

// 🔹 Coupon → DTO
export function toCouponResponseDTO(coupon: Coupon): CouponResponseDTO {
  if (!coupon) return null;
  return {
    id: coupon.id,
    code: coupon.code,
    title: coupon.title,
    discountPercent: coupon.discountPercent,
    validFrom: coupon.validFrom,
    validTo: coupon.validTo,
    active: coupon.active,
  };
}

// 🔹 Payment → DTO
export function toPaymentResponseDTO(payment: Payment): PaymentResponseDTO {
  if (!payment) return null;
  return {
    id: payment.id,
    userId: payment.user?.id,
    userFullName: payment.user?.fullname,
    userEmail: payment.user?.email,
    tranId: payment.tranId,
    eventId: payment.event?.id,
    eventTitle: payment.event.title,
    amount: payment.amount,
    status: payment.status,
    method: payment.method,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}
