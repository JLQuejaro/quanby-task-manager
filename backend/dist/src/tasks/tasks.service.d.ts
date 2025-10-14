import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';
export declare class TasksService {
    create(createTaskDto: CreateTaskDto, userId: number): Promise<{
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
    findAll(userId: number): Promise<{
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
    findOne(id: number, userId: number): Promise<{
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
    update(id: number, updateTaskDto: UpdateTaskDto, userId: number): Promise<{
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
    remove(id: number, userId: number): Promise<{
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
