import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Length } from 'class-validator';

export class Verify2FADTO {
  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
