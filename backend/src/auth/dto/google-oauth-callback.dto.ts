import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleOAuthCallbackDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idToken: string;
}