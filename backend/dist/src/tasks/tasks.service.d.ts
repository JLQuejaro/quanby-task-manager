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
    toggleComplete(id: number, userId: number): Promise<{
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
    archiveTask(id: number, userId: number): Promise<{
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
    getArchivedTasks(userId: number): Promise<{
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
    restoreTask(archivedId: number, userId: number): Promise<{
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
    permanentlyDeleteTask(archivedId: number, userId: number): Promise<{
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
    clearAllArchived(userId: number): Promise<{
        message: string;
        count: number;
    }>;
}
