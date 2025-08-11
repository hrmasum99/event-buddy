import { ApiProperty } from '@nestjs/swagger';
import { Booking } from 'src/bookings/bookings.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('events')
export class EventEntity {
  @ApiProperty({ description: 'Unique identifier for the event', example: 101 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Title of the event',
    example: 'Tech Conference 2025',
  })
  @Column()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the event',
    example: 'A global tech event...',
  })
  @Column()
  description: string;

  @ApiProperty({
    description: 'Date and time of the event',
    example: '2025-10-01T14:00:00Z',
  })
  @Column({ type: 'timestamp' })
  date: Date;

  @ApiProperty({
    description: 'Location of the event',
    example: 'San Francisco, CA',
  })
  @Column()
  location: string;

  @ApiProperty({ description: 'Total number of available seats', example: 150 })
  @Column('int')
  totalSeats: number;

  @ApiProperty({
    description: 'Tags or categories related to the event',
    example: 'Tech, AI, Startup',
  })
  @Column()
  tags: string;

  // @ApiProperty({ description: 'Filename of the event image', example: '1694352486event.png' })
  // @Column({ type: 'varchar', name: 'Photo', default: 'N/A' })
  // file: string;

  // Store Cloudinary URL instead of filename
  @ApiProperty({ description: 'Store Cloudinary URL', example: '' })
  @Column({ nullable: true })
  imageUrl: string;

  // Store Cloudinary public_id for deletion/updates
  @ApiProperty({
    description: 'Store Cloudinary public_id for deletion/updates',
    example: '',
  })
  @Column({ nullable: true })
  imagePublicId: string;

  @OneToMany(() => Booking, (booking) => booking.event)
  bookings: Booking[];
}
