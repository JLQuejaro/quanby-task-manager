export declare class CreateTaskDto {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    deadline?: string;
    completed?: boolean;
}
export declare class UpdateTaskDto {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    deadline?: string;
    completed?: boolean;
}
