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
    async remove(id, userId) {
        const [task] = await db_1.db.delete(schema_1.tasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.id, id), (0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId)))
            .returning();
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        return task;
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)()
], TasksService);
//# sourceMappingURL=tasks.service.js.map