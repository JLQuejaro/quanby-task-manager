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
        description: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        priority: string;
        deadline: Date;
        completed: boolean;
        userId: number;
    }[]>;
    findOne(id: string, req: any): Promise<{
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
    update(id: string, updateTaskDto: UpdateTaskDto, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
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
}
