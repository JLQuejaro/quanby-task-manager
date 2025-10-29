import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../database/db';
import { tasks, archivedTasks } from '../database/schema';
import { eq, and, lt } from 'drizzle-orm';
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

  // Delete task (OLD - no longer used directly)
  async remove(id: number, userId: number) {
    const [task] = await db.delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  // ========== NEW ARCHIVE METHODS ==========

  // Archive task instead of deleting
  async archiveTask(id: number, userId: number) {
    // Get the task first
    const task = await this.findOne(id, userId);

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Insert into archived_tasks
    const [archived] = await db.insert(archivedTasks).values({
      originalTaskId: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      deadline: task.deadline,
      completed: task.completed,
      userId: task.userId,
      deletedAt: new Date(),
      expiresAt: expiresAt,
      originalCreatedAt: task.createdAt,
      originalUpdatedAt: task.updatedAt,
    }).returning();

    // Delete from tasks table
    await db.delete(tasks).where(
      and(eq(tasks.id, id), eq(tasks.userId, userId))
    );

    return {
      message: 'Task archived successfully',
      expiresAt: archived.expiresAt,
      archivedTask: archived,
    };
  }

  // Get all archived tasks for a user
  async getArchivedTasks(userId: number) {
    // First, clean up expired tasks
    const now = new Date();
    await db.delete(archivedTasks).where(
      and(
        eq(archivedTasks.userId, userId),
        lt(archivedTasks.expiresAt, now)
      )
    );

    // Then return remaining archived tasks
    const archived = await db.select()
      .from(archivedTasks)
      .where(eq(archivedTasks.userId, userId));

    return archived;
  }

  // Restore archived task
  async restoreTask(archivedId: number, userId: number) {
    // Get the archived task
    const [archived] = await db.select()
      .from(archivedTasks)
      .where(
        and(
          eq(archivedTasks.id, archivedId),
          eq(archivedTasks.userId, userId)
        )
      );

    if (!archived) {
      throw new NotFoundException('Archived task not found');
    }

    // Check if expired
    if (new Date(archived.expiresAt) < new Date()) {
      throw new NotFoundException('Archived task has expired');
    }

    // Restore to tasks table
    const [restoredTask] = await db.insert(tasks).values({
      title: archived.title,
      description: archived.description,
      priority: archived.priority,
      deadline: archived.deadline,
      completed: archived.completed,
      userId: archived.userId,
      createdAt: archived.originalCreatedAt || new Date(),
      updatedAt: new Date(),
    }).returning();

    // Delete from archived_tasks
    await db.delete(archivedTasks).where(
      and(
        eq(archivedTasks.id, archivedId),
        eq(archivedTasks.userId, userId)
      )
    );

    return {
      message: 'Task restored successfully',
      task: restoredTask,
    };
  }

  // Permanently delete archived task
  async permanentlyDeleteTask(archivedId: number, userId: number) {
    const [archived] = await db.delete(archivedTasks)
      .where(
        and(
          eq(archivedTasks.id, archivedId),
          eq(archivedTasks.userId, userId)
        )
      )
      .returning();

    if (!archived) {
      throw new NotFoundException('Archived task not found');
    }

    return {
      message: 'Task permanently deleted',
      deletedTask: archived,
    };
  }

  // Clear all archived tasks
  async clearAllArchived(userId: number) {
    const deleted = await db.delete(archivedTasks)
      .where(eq(archivedTasks.userId, userId))
      .returning();

    return {
      message: 'All archived tasks cleared',
      count: deleted.length,
    };
  }
}