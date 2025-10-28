import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    create(createTaskDto: CreateTaskDto, req: any): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
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
    findOne(id: string, req: any): Promise<{
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
    update(id: string, updateTaskDto: UpdateTaskDto, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        priority: string;
        deadline: Date;
        completed: boolean;
        userId: number;
    }>;
}
