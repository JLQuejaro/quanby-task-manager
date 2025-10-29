"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const tasks_service_1 = require("./tasks.service");
const create_task_dto_1 = require("./dto/create-task.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let TasksController = class TasksController {
    constructor(tasksService) {
        this.tasksService = tasksService;
    }
    create(createTaskDto, req) {
        return this.tasksService.create(createTaskDto, req.user.id);
    }
    findAll(req) {
        return this.tasksService.findAll(req.user.id);
    }
    findOne(id, req) {
        if (isNaN(id)) {
            throw new common_1.HttpException('Invalid task ID', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.tasksService.findOne(id, req.user.id);
    }
    update(id, updateTaskDto, req) {
        if (isNaN(id)) {
            throw new common_1.HttpException('Invalid task ID', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.tasksService.update(id, updateTaskDto, req.user.id);
    }
    remove(id, req) {
        if (isNaN(id)) {
            throw new common_1.HttpException('Invalid task ID', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.tasksService.archiveTask(id, req.user.id);
    }
    getArchivedTasks(req) {
        return this.tasksService.getArchivedTasks(req.user.id);
    }
    restoreTask(id, req) {
        if (isNaN(id)) {
            throw new common_1.HttpException('Invalid task ID', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.tasksService.restoreTask(id, req.user.id);
    }
    permanentlyDeleteTask(id, req) {
        if (isNaN(id)) {
            throw new common_1.HttpException('Invalid task ID', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.tasksService.permanentlyDeleteTask(id, req.user.id);
    }
    clearAllArchived(req) {
        return this.tasksService.clearAllArchived(req.user.id);
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new task' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Task created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_task_dto_1.CreateTaskDto, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all tasks for the authenticated user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return all tasks' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific task by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return the task' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Task not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a specific task by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Task not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_task_dto_1.UpdateTaskDto, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Archive a specific task by ID (soft delete)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task archived successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Task not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('archived/all'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all archived tasks' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return all archived tasks' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "getArchivedTasks", null);
__decorate([
    (0, common_1.Post)('archived/:id/restore'),
    (0, swagger_1.ApiOperation)({ summary: 'Restore an archived task' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task restored successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Archived task not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "restoreTask", null);
__decorate([
    (0, common_1.Delete)('archived/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Permanently delete an archived task' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task permanently deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Archived task not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "permanentlyDeleteTask", null);
__decorate([
    (0, common_1.Delete)('archived/clear-all/all'),
    (0, swagger_1.ApiOperation)({ summary: 'Clear all archived tasks' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All archived tasks cleared' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "clearAllArchived", null);
exports.TasksController = TasksController = __decorate([
    (0, swagger_1.ApiTags)('tasks'),
    (0, common_1.Controller)('tasks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TasksController);
//# sourceMappingURL=tasks.controller.js.map