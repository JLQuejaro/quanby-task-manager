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
    findOne(id: number, userId: number): Promise<{
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
    update(id: number, updateTaskDto: UpdateTaskDto, userId: number): Promise<{
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
