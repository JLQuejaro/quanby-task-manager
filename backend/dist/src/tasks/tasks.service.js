"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../database/db");
const schema_1 = require("../database/schema");
const drizzle_orm_1 = require("drizzle-orm");
let TasksService = class TasksService {
    async create(createTaskDto, userId) {
        const [task] = await db_1.db.insert(schema_1.tasks).values({
            ...createTaskDto,
            userId,
            deadline: createTaskDto.deadline ? new Date(createTaskDto.deadline) : null,
        }).returning();
        return task;
    }
    async findAll(userId) {
        return await db_1.db.select().from(schema_1.tasks).where((0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId));
    }
    async findOne(id, userId) {
        const [task] = await db_1.db.select().from(schema_1.tasks).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.id, id), (0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId)));
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        return task;
    }
    async update(id, updateTaskDto, userId) {
        const [task] = await db_1.db.update(schema_1.tasks)
            .set({
            ...updateTaskDto,
            deadline: updateTaskDto.deadline ? new Date(updateTaskDto.deadline) : undefined,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.id, id), (0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId)))
            .returning();
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        return task;
    }
    async toggleComplete(id, userId) {
        const task = await this.findOne(id, userId);
        const [updated] = await db_1.db.update(schema_1.tasks)
            .set({
            completed: !task.completed,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.id, id), (0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId)))
            .returning();
        return updated;
    }
    async remove(id, userId) {
        const [task] = await db_1.db.delete(schema_1.tasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.id, id), (0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId)))
            .returning();
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        return task;
    }
    async archiveTask(id, userId) {
        const task = await this.findOne(id, userId);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        const [archived] = await db_1.db.insert(schema_1.archivedTasks).values({
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
        await db_1.db.delete(schema_1.tasks).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.id, id), (0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId)));
        return {
            message: 'Task archived successfully',
            expiresAt: archived.expiresAt,
            archivedTask: archived,
        };
    }
    async getArchivedTasks(userId) {
        const now = new Date();
        await db_1.db.delete(schema_1.archivedTasks).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.archivedTasks.userId, userId), (0, drizzle_orm_1.lt)(schema_1.archivedTasks.expiresAt, now)));
        const archived = await db_1.db.select()
            .from(schema_1.archivedTasks)
            .where((0, drizzle_orm_1.eq)(schema_1.archivedTasks.userId, userId));
        return archived;
    }
    async restoreTask(archivedId, userId) {
        const [archived] = await db_1.db.select()
            .from(schema_1.archivedTasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.archivedTasks.id, archivedId), (0, drizzle_orm_1.eq)(schema_1.archivedTasks.userId, userId)));
        if (!archived) {
            throw new common_1.NotFoundException('Archived task not found');
        }
        if (new Date(archived.expiresAt) < new Date()) {
            throw new common_1.NotFoundException('Archived task has expired');
        }
        const [restoredTask] = await db_1.db.insert(schema_1.tasks).values({
            title: archived.title,
            description: archived.description,
            priority: archived.priority,
            deadline: archived.deadline,
            completed: archived.completed,
            userId: archived.userId,
            createdAt: archived.originalCreatedAt || new Date(),
            updatedAt: new Date(),
        }).returning();
        await db_1.db.delete(schema_1.archivedTasks).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.archivedTasks.id, archivedId), (0, drizzle_orm_1.eq)(schema_1.archivedTasks.userId, userId)));
        return {
            message: 'Task restored successfully',
            task: restoredTask,
        };
    }
    async permanentlyDeleteTask(archivedId, userId) {
        const [archived] = await db_1.db.delete(schema_1.archivedTasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.archivedTasks.id, archivedId), (0, drizzle_orm_1.eq)(schema_1.archivedTasks.userId, userId)))
            .returning();
        if (!archived) {
            throw new common_1.NotFoundException('Archived task not found');
        }
        return {
            message: 'Task permanently deleted',
            deletedTask: archived,
        };
    }
    async clearAllArchived(userId) {
        const deleted = await db_1.db.delete(schema_1.archivedTasks)
            .where((0, drizzle_orm_1.eq)(schema_1.archivedTasks.userId, userId))
            .returning();
        return {
            message: 'All archived tasks cleared',
            count: deleted.length,
        };
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)()
], TasksService);
//# sourceMappingURL=tasks.service.js.map