import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { EventsService } from 'src/events/events.service';
import { CreateEventDTO } from 'src/events/dto/create-event.dto';
import { EventResponseDTO } from 'src/events/dto/event-response.dto';
import {
  UpdateEventDTO,
  UploadImageDTO,
} from 'src/events/dto/update-event.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, MulterError } from 'multer';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from 'src/common/enums/role.enum';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from './users.entity';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserResponseDTO } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('User')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('/profile')
  // @ApiBearerAuth()
  @ApiOkResponse({ description: 'User profile returned', type: User })
  getUserProfile(@GetUser() user: User) {
    return user;
  }

  @Roles(Role.Admin)
  @Get('/all-users')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'List of all users', type: [UserResponseDTO] })
  findAll(): Promise<UserResponseDTO[]> {
    return this.usersService.findAll();
  }

  @Roles(Role.Admin)
  @Post('/create-event')
  @ApiCreatedResponse({
    description: 'Event created successfully',
    type: EventResponseDTO,
  })
  @ApiBadRequestResponse({ description: 'Invalid event creation request' })
  async createEvent(
    @Body() eventData: CreateEventDTO,
  ): Promise<EventResponseDTO> {
    return this.eventsService.createEvent(eventData);
  }

  @Roles(Role.Admin)
  @Put('/upload-event-image/:id')
  @ApiOkResponse({ description: 'Event image uploaded successfully' })
  @UseInterceptors(
    FileInterceptor('myfile', {
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/^.*\.(jpg|jpeg|png|webp)$/))
          cb(null, true);
        else {
          cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'image'), false);
        }
      },
      limits: { fileSize: 3000000 },
      storage: diskStorage({
        destination: './uploads',
        filename: function (req, file, cb) {
          cb(null, Date.now() + file.originalname);
        },
      }),
    }),
  )
  async uploadEventImage(
    @Param('id') id: number,
    @Body() updateEventDto: UploadImageDTO,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    updateEventDto.file = file.filename;

    return this.eventsService.uploadEventImage(id, updateEventDto);
  }

  @Roles(Role.Admin)
  @Patch('update-event/:id')
  @ApiOkResponse({
    description: 'Event updated successfully',
    type: EventResponseDTO,
  })
  async updateProfile(
    @Param('id') id: number,
    @Body() updateEventDto: UpdateEventDTO,
  ): Promise<EventResponseDTO> {
    return this.eventsService.updateEvent(id, updateEventDto);
  }

  @Roles(Role.Admin)
  @Put('/update-event-image/:id')
  @ApiOkResponse({ description: 'Event image updated successfully' })
  @UseInterceptors(
    FileInterceptor('myfile', {
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/^.*\.(jpg|jpeg|png|webp)$/))
          cb(null, true);
        else {
          cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'image'), false);
        }
      },
      limits: { fileSize: 3000000 },
      storage: diskStorage({
        destination: './uploads',
        filename: function (req, file, cb) {
          cb(null, Date.now() + file.originalname);
        },
      }),
    }),
  )
  async updateEventImage(
    @Param('id') id: number,
    @Body() updateEventDto: UploadImageDTO,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    updateEventDto.file = file.filename;

    return this.eventsService.updateEventImage(id, updateEventDto);
  }

  @Roles(Role.Admin)
  @Delete('/delete-event/:id')
  @ApiOkResponse({ description: 'Event deleted successfully' })
  async deleteEvent(@Param('id') id: number): Promise<void> {
    return this.eventsService.deleteEvent(id);
  }
}
