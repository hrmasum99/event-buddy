import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, LessThan, Repository } from 'typeorm';
import { CreateEventDTO } from './dto/create-event.dto';
import { EventEntity } from './events.entity';
import { EventResponseDTO } from './dto/event-response.dto';
import { UpdateEventDTO, UploadImageDTO } from './dto/update-event.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginationResponseDto } from 'src/common/dto/pagination-response.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity)
    // private readonly eventsRepo: Repository<EventResponseDTO>,
    private readonly eventsRepo: Repository<EventEntity>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findAll(paginationDto: PaginationDto): Promise<PaginationResponseDto<EventResponseDTO>> {
    const { page, limit } = paginationDto;
    const [result, total] = await this.eventsRepo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data: result,
      meta: {
        page,
        limit,
        total_items: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getUpcomingEvents(paginationDto: PaginationDto): Promise<PaginationResponseDto<EventResponseDTO>> {
    const { page, limit } = paginationDto;
    const now = new Date();
    const [result, total] = await this.eventsRepo.findAndCount({
      where: {
        date: MoreThan(now),
      },
      order: {
        date: 'ASC',
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data: result,
      meta: {
        page,
        limit,
        total_items: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getPreviousEvents(paginationDto: PaginationDto): Promise<PaginationResponseDto<EventResponseDTO>> {
    const { page, limit } = paginationDto;
    const now = new Date();
    const [result, total] = await this.eventsRepo.findAndCount({
      where: {
        date: LessThan(now),
      },
      order: {
        date: 'DESC',
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data: result,
      meta: {
        page,
        limit,
        total_items: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getEvent(id: number): Promise<EventResponseDTO> {
    return await this.eventsRepo.findOneBy({ id: id });
  }

  async createEvent(eventData: CreateEventDTO): Promise<EventResponseDTO> {
    const eventTitle = await this.eventsRepo.findOne({
      where: { title: eventData.title },
    });

    if (eventTitle) {
      throw new BadRequestException('This event already exists!');
    }

    const event = this.eventsRepo.create({
      ...eventData,
    });

    return await this.eventsRepo.save(event);
  }

  // async uploadEventImage(
  //   id: number,
  //   uploadImageDto: UploadImageDTO,
  // ): Promise<EventResponseDTO> {
  //   const event = await this.eventsRepo.findOne({
  //     where: { id },
  //   });

  //   if (!event) {
  //     throw new NotFoundException(`Event with ID ${id} not found`);
  //   }

  //   event.file = uploadImageDto.file;
  //   return this.eventsRepo.save(event);
  // }

  async uploadEventImage(
    id: number,
    file: Express.Multer.File,
  ): Promise<EventEntity> {
    if (!file) throw new BadRequestException('No file provided');

    const event = await this.eventsRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

    try {
      const result = await this.cloudinaryService.uploadImage(file, 'events');
      event.imageUrl = result.secure_url;
      event.imagePublicId = result.public_id;
      return await this.eventsRepo.save(event);
    } catch (error) {
      throw new BadRequestException(`Image upload failed: ${error.message}`);
    }
  }

  async updateEvent(
    id: number,
    updateEventDto: UpdateEventDTO,
  ): Promise<EventResponseDTO> {
    const event = await this.eventsRepo.findOne({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    const updated = this.eventsRepo.merge(event, updateEventDto);
    return this.eventsRepo.save(updated);
  }

  // async updateEventImage(
  //   id: number,
  //   updateImage: UploadImageDTO,
  // ): Promise<EventResponseDTO> {
  //   const event = await this.eventsRepo.findOne({
  //     where: { id },
  //   });

  //   if (!event) {
  //     throw new NotFoundException(`Event ID:${id} not found`);
  //   }

  //   event.file = updateImage.file;
  //   return this.eventsRepo.save(event);
  // }

  async updateEventImage(
    id: number,
    file: Express.Multer.File,
  ): Promise<EventEntity> {
    if (!file) throw new BadRequestException('No file provided');

    const event = await this.eventsRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

    try {
      if (event.imagePublicId) {
        await this.cloudinaryService.deleteImage(event.imagePublicId);
      }
      const result = await this.cloudinaryService.uploadImage(file, 'events');
      event.imageUrl = result.secure_url;
      event.imagePublicId = result.public_id;
      return await this.eventsRepo.save(event);
    } catch (error) {
      throw new BadRequestException(`Image update failed: ${error.message}`);
    }
  }

  // async getEventImage(id: number): Promise<any> {
  //   const event = await this.eventsRepo.findOne({
  //     where: { id },
  //   });

  //   if (!event) {
  //     throw new NotFoundException(`Event Id:${id} not found!`);
  //   }

  //   if (!event.file) {
  //     throw new NotFoundException(`No image found for event ID:${id}!`);
  //   }

  //   return event.file;
  // }

  async getEventImage(id: number): Promise<string> {
    const event = await this.eventsRepo.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    if (!event.imageUrl) {
      throw new NotFoundException(`No image found for event ID ${id}`);
    }

    return event.imageUrl;
  }

  async getMyEvents(userId: number): Promise<EventResponseDTO[]> {
    return this.eventsRepo.find({
      where: { id: userId },
      relations: ['user'],
    });
  }

  async deleteEvent(id: number): Promise<void> {
    const event = await this.eventsRepo.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event ID:${id} not found`);
    }
    await this.eventsRepo.delete(id);
  }
}
