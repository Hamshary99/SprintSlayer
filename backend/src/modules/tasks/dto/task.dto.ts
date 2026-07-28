import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, IsIn } from 'class-validator';

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    title!: string;
    
    @IsString()
    @IsOptional()
    description?: string;
    
    @IsString()
    @IsIn(['to_do', 'in_progress', 'done'])
    @IsOptional()
    status: 'to_do' | 'in_progress' | 'done' = 'to_do';
    
    @IsString()
    @IsIn(['high', 'medium', 'low'])
    @IsOptional()
    priority: 'high' | 'medium' | 'low' = 'medium';
    
    @IsDateString()
    @IsOptional()
    dueDate?: Date;
    
    // NOTE: creatorId is always injected server-side from req.user.id — never trust the client.
    @IsNumber()
    @IsOptional()
    creatorId?: number;
    
    @IsNumber()
    @IsOptional()
    assigneeId?: number;
    
    @IsNumber()
    @IsNotEmpty()
    projectId!: number;
}

export class UpdateTaskDto {
    @IsString()
    @IsOptional()
    title?: string;
    
    @IsString()
    @IsOptional()
    description?: string;
    
    @IsString()
    @IsIn(['to_do', 'in_progress', 'done'])
    @IsOptional()
    status?: 'to_do' | 'in_progress' | 'done';
    
    @IsString()
    @IsIn(['high', 'medium', 'low'])
    @IsOptional()
    priority?: 'high' | 'medium' | 'low';
    
    @IsDateString()
    @IsOptional()
    dueDate?: Date;
    
    @IsNumber()
    @IsOptional()
    assigneeId?: number;
}

