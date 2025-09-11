import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EventEntity } from './events.entity';

@Entity('coupons')
export class Coupon {
  @ApiProperty({
    description: 'Unique identifier for the coupon',
    example: 101,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Coupon code for discount',
    example: 'EARLYBIRD25',
  })
  @Column({ unique: true })
  code: string; // e.g., "EARLYBIRD20"

  @ApiProperty({
    description: 'Coupon title',
    example: '',
  })
  @Column()
  title: string;

  @ApiProperty({
    description: 'Coupon discount percents',
    example: 25,
  })
  @Column({ type: 'int', default: 0 })
  discountPercent: number; // 0..100

  @ApiProperty({
    description: 'Date and time of the start date of coupon',
    example: '2025-9-01T00:00:00Z',
  })
  @Column({ type: 'timestamp' })
  validFrom: Date;

  @ApiProperty({
    description: 'Date and time of the end date of coupon',
    example: '2025-10-01T23:59:59Z',
  })
  @Column({ type: 'timestamp' })
  validTo: Date;

  @ApiProperty({
    description: 'Active status of coupon',
    example: 'true or false',
  })
  @Column({ default: true })
  active: boolean;

  @ManyToOne(() => EventEntity, (event) => event.coupons, {
    onDelete: 'CASCADE',
  })
  event: EventEntity;
}
