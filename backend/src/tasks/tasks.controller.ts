import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Req,
  ParseIntPipe,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    return this.tasksService.create(createTaskDto, req.user.id);
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
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    // FIX: Validate that id is a valid number
    if (isNaN(id)) {
      throw new HttpException('Invalid task ID', HttpStatus.BAD_REQUEST);
    }
    return this.tasksService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific task by ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: any
  ) {
    // FIX: Validate that id is a valid number
    if (isNaN(id)) {
      throw new HttpException('Invalid task ID', HttpStatus.BAD_REQUEST);
    }
    return this.tasksService.update(id, updateTaskDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive a specific task by ID (soft delete)' })
  @ApiResponse({ status: 200, description: 'Task archived successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    // FIX: Validate that id is a valid number
    if (isNaN(id)) {
      throw new HttpException('Invalid task ID', HttpStatus.BAD_REQUEST);
    }
    // Archive instead of permanently delete
    return this.tasksService.archiveTask(id, req.user.id);
  }

  // ========== NEW ARCHIVE ENDPOINTS ==========

  @Get('archived/all')
  @ApiOperation({ summary: 'Get all archived tasks' })
  @ApiResponse({ status: 200, description: 'Return all archived tasks' })
  getArchivedTasks(@Req() req: any) {
    return this.tasksService.getArchivedTasks(req.user.id);
  }

  @Post('archived/:id/restore')
  @ApiOperation({ summary: 'Restore an archived task' })
  @ApiResponse({ status: 200, description: 'Task restored successfully' })
  @ApiResponse({ status: 404, description: 'Archived task not found' })
  restoreTask(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    if (isNaN(id)) {
      throw new HttpException('Invalid task ID', HttpStatus.BAD_REQUEST);
    }
    return this.tasksService.restoreTask(id, req.user.id);
  }

  @Delete('archived/:id')
  @ApiOperation({ summary: 'Permanently delete an archived task' })
  @ApiResponse({ status: 200, description: 'Task permanently deleted' })
  @ApiResponse({ status: 404, description: 'Archived task not found' })
  permanentlyDeleteTask(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    if (isNaN(id)) {
      throw new HttpException('Invalid task ID', HttpStatus.BAD_REQUEST);
    }
    return this.tasksService.permanentlyDeleteTask(id, req.user.id);
  }

  @Delete('archived/clear-all/all')
  @ApiOperation({ summary: 'Clear all archived tasks' })
  @ApiResponse({ status: 200, description: 'All archived tasks cleared' })
  clearAllArchived(@Req() req: any) {
    return this.tasksService.clearAllArchived(req.user.id);
  }
}
