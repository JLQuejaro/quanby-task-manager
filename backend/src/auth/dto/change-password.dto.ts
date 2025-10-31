import { IsString, MinLength, IsNotEmpty, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password for validation' })
  @IsString({ message: 'Current password must be a string' })
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({ 
    minLength: 8,
    description: 'New password (at least 8 characters with uppercase, lowercase, number, and special character)'
  })
  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;

  @ApiProperty({ minLength: 8, description: 'Confirmation of new password' })
  @IsString({ message: 'New password confirmation must be a string' })
  @IsNotEmpty({ message: 'New password confirmation is required' })
  @MinLength(8, { message: 'New password confirmation must be at least 8 characters long' })
  newPasswordConfirm: string;
}