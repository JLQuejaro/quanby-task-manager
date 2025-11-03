import { IsString, MinLength, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPasswordDto {
  @ApiProperty({ 
    minLength: 8,
    description: 'Password (at least 8 characters with uppercase, lowercase, number, and special character)'
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?!.*\s).{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and no spaces'
  })
  password: string;

  @ApiProperty({ minLength: 8, description: 'Confirmation of password' })
  @IsString({ message: 'Password confirmation must be a string' })
  @IsNotEmpty({ message: 'Password confirmation is required' })
  @MinLength(8, { message: 'Password confirmation must be at least 8 characters long' })
  passwordConfirm: string;
}