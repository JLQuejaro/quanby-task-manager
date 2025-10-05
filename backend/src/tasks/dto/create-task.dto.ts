import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Data structure for creating a task
export class CreateTaskDto {
  @ApiProperty({ example: 'Complete project documentation' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Write comprehensive API docs' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['low', 'medium', 'high'], example: 'high' })
  @IsEnum(['low', 'medium', 'high'])
  priority: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

// Data structure for updating a task (all fields optional)
export class UpdateTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high'] })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}