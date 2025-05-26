import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThan, LessThan, Repository } from "typeorm";
import { CreateEventDTO } from "./dto/create-event.dto";
import { EventEntity } from "./events.entity";
import { EventResponseDTO } from "./dto/event-response.dto";
import { UpdateEventDTO, UploadImageDTO } from "./dto/update-event.dto";

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventsRepo: Repository<EventResponseDTO>,
  ) {}

  async findAll(): Promise<EventResponseDTO[]> {
    return this.eventsRepo.find();
  }

  async getUpcomingEvents(): Promise<EventResponseDTO[]> {
    const now = new Date();
    return this.eventsRepo.find({
      where: {
        date: MoreThan(now),
      },
      order: {
        date: 'ASC',
      },
    });
  }

  async getPreviousEvents(): Promise<EventResponseDTO[]> {
    const now = new Date();
    return this.eventsRepo.find({
      where: {
        date: LessThan(now),
      },
      order: {
        date: 'DESC',
      },
    });
  }

  async  getEvent(id:number): Promise<EventResponseDTO> {
    return await this.eventsRepo.findOneBy({ id:id });
  }

  async createEvent(eventData: CreateEventDTO): Promise<EventResponseDTO> { 
    const eventTitle = await this.eventsRepo.findOne({
      where: { title: eventData.title },
    });

    if (eventTitle) {
      throw new BadRequestException('This event already exists!');
    }

    const event = this.eventsRepo.create({
      ...eventData
    });

    return await this.eventsRepo.save(event);
  }

  async uploadEventImage(id: number, uploadImageDto: UploadImageDTO): Promise<EventResponseDTO> {
    const event = await this.eventsRepo.findOne({
      where: { id }
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    event.file = uploadImageDto.file;
    return this.eventsRepo.save(event);
  }

  async updateEvent(id: number, updateEventDto: UpdateEventDTO): Promise<EventResponseDTO> {
    const event = await this.eventsRepo.findOne({
      where: { id }
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    const updated = this.eventsRepo.merge(event, updateEventDto);
    return this.eventsRepo.save(updated);
  }

  async updateEventImage(id: number, updateImage: UploadImageDTO): Promise<EventResponseDTO> {
    const event = await this.eventsRepo.findOne({
      where: { id }
    });

    if (!event) {
      throw new NotFoundException(`Event ID:${id} not found`);
    }

    event.file = updateImage.file;
    return this.eventsRepo.save(event);
  }

  async getEventImage(id: number): Promise<any> {
    const event = await this.eventsRepo.findOne({
        where: { id }
    });

    if (!event) {
      throw new NotFoundException(`Event Id:${id} not found!`);
    }

    if (!event.file) {
      throw new NotFoundException(`No image found for event ID:${id}!`);
    } 

    return event.file;
  }

  async getMyEvents(userId: number): Promise<EventResponseDTO[]> {
    return this.eventsRepo.find({
      where: { id: userId }, 
      relations: ['user'], 
    });
  }

  async deleteEvent(id: number): Promise<void> 
  {
    const event = await this.eventsRepo.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event ID:${id} not found`);
    }
      await this.eventsRepo.delete(id);
  }

}