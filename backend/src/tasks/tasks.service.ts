import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../database/db';
import { tasks } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  // Create new task
  async create(createTaskDto: CreateTaskDto, userId: number) {
    const [task] = await db.insert(tasks).values({
      ...createTaskDto,
      userId,
      deadline: createTaskDto.deadline ? new Date(createTaskDto.deadline) : null,
    }).returning();
    return task;
  }

  // Get all tasks for a user
  async findAll(userId: number) {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  // Get one task by ID
  async findOne(id: number, userId: number) {
    const [task] = await db.select().from(tasks).where(
      and(eq(tasks.id, id), eq(tasks.userId, userId))
    );
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  // Update task
  async update(id: number, updateTaskDto: UpdateTaskDto, userId: number) {
    const [task] = await db.update(tasks)
      .set({
        ...updateTaskDto,
        deadline: updateTaskDto.deadline ? new Date(updateTaskDto.deadline) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  // Delete task
  async remove(id: number, userId: number) {
    const [task] = await db.delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }
}