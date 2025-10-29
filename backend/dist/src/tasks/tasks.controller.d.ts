import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    create(createTaskDto: CreateTaskDto, req: any): Promise<{
        description: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        priority: string;
        deadline: Date;
        completed: boolean;
        userId: number;
    }>;
    findAll(req: any): Promise<{
        id: number;
        title: string;
        description: string;
        priority: string;
        deadline: Date;
        completed: boolean;
        userId: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: number, req: any): Promise<{
        id: number;
        title: string;
        description: string;
        priority: string;
        deadline: Date;
        completed: boolean;
        userId: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: number, updateTaskDto: UpdateTaskDto, req: any): Promise<{
        id: number;
        title: string;
        description: string;
        priority: string;
        deadline: Date;
        completed: boolean;
        userId: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: number, req: any): Promise<{
        message: string;
        expiresAt: Date;
        archivedTask: {
            description: string;
            id: number;
            createdAt: Date;
            title: string;
            priority: string;
            deadline: Date;
            completed: boolean;
            userId: number;
            originalTaskId: number;
            deletedAt: Date;
            expiresAt: Date;
            originalCreatedAt: Date;
            originalUpdatedAt: Date;
        };
    }>;
    getArchivedTasks(req: any): Promise<{
        id: number;
        originalTaskId: number;
        title: string;
        description: string;
        priority: string;
        deadline: Date;
        completed: boolean;
        userId: number;
        deletedAt: Date;
        expiresAt: Date;
        originalCreatedAt: Date;
        originalUpdatedAt: Date;
        createdAt: Date;
    }[]>;
    restoreTask(id: number, req: any): Promise<{
        message: string;
        task: {
            description: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            priority: string;
            deadline: Date;
            completed: boolean;
            userId: number;
        };
    }>;
    permanentlyDeleteTask(id: number, req: any): Promise<{
        message: string;
        deletedTask: {
            description: string;
            id: number;
            createdAt: Date;
            title: string;
            priority: string;
            deadline: Date;
            completed: boolean;
            userId: number;
            originalTaskId: number;
            deletedAt: Date;
            expiresAt: Date;
            originalCreatedAt: Date;
            originalUpdatedAt: Date;
        };
    }>;
    clearAllArchived(req: any): Promise<{
        message: string;
        count: number;
    }>;
}
