import { Controller, Get, Param,  Res, UseGuards } from "@nestjs/common";
import { EventsService } from "./events.service";
import { EventResponseDTO } from "./dto/event-response.dto";
import { Role } from "src/common/enums/role.enum";
import { Roles } from "src/common/decorators/roles.decorators";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { User } from "src/users/users.entity";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('/')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'List of all events', type: [EventResponseDTO] })
  findAll(): Promise<EventResponseDTO[]> {
    return this.eventsService.findAll();
  }

  @Get('/upcoming')
  @ApiOkResponse({ description: 'Upcoming events list', type: [EventResponseDTO] })
  getUpcomingEvents(): Promise<EventResponseDTO[]> {
    return this.eventsService.getUpcomingEvents();
  }

  @Get('/previous')
  @ApiOkResponse({ description: 'Previous events list', type: [EventResponseDTO] })
  getPreviousEvents(): Promise<EventResponseDTO[]> {
    return this.eventsService.getPreviousEvents();
  } 

  @Get('/:id')
  @ApiOkResponse({ description: 'Get event by ID', type: EventResponseDTO })
  @ApiNotFoundResponse({ description: 'Event not found' })
  getEvent(@Param('id') id: number): Promise<EventResponseDTO> {
    return this.eventsService.getEvent(id);
  }

  @Get('/getimage/:id')
  @ApiOkResponse({ description: 'Image file returned' })
    async getImage(@Param('id') id: number, @Res() res): Promise<any> {
        const filename = await this.eventsService.getEventImage(id); 

        return res.sendFile(filename, { root: './uploads' });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('my-events')
  @ApiOkResponse({ description: 'Events booked by user', type: [EventResponseDTO] })
  @ApiBearerAuth()
  @Roles(Role.User)
  getMyEvents(@GetUser() user: User) {
    return this.eventsService.getMyEvents(user.id);
  }

}