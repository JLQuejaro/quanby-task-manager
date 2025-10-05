import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard) // Require authentication for all task endpoints
@ApiBearerAuth() // Add Bearer token to Swagger UI
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    return this.tasksService.create(createTaskDto, req.user.id); // req.user is populated by JWT strategy
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Return all tasks' })
  findAll(@Req() req: any) {
    return this.tasksService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task by ID' })
  @ApiResponse({ status: 200, description: 'Return the task' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific task by ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Req() req: any) {
    return this.tasksService.update(+id, updateTaskDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific task by ID' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.remove(+id, req.user.id);
  }
}