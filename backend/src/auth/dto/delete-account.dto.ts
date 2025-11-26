import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({ 
    example: 'Password123!', 
    description: 'Current password (required for password users)',
    required: false
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
