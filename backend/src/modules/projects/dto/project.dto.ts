import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateProjectDto {
    @IsString()
    @IsNotEmpty()
    title!: string;
    
    @IsString()
    @IsOptional()
    description?: string;
    
    @IsNumber()
    @IsNotEmpty()
    ownerId!: number;
}

export class UpdateProjectDto {
    @IsString()
    @IsOptional()
    title?: string;
    
    @IsString()
    @IsOptional()
    description?: string;
}

export class DeleteProjectDto {
    @IsNumber()
    @IsNotEmpty()
    id!: number;
    
    @IsNumber()
    @IsNotEmpty()
    ownerId!: number;
}

export class RemoveProjectMemberDto {
    @IsNumber()
    @IsNotEmpty()
    projectId!: number;
    
    @IsNumber()
    @IsNotEmpty()
    userId!: number;
}

export class AddProjectMemberDto {
    @IsNumber()
    @IsNotEmpty()
    projectId!: number;
    
    @IsNumber()
    @IsNotEmpty()
    userId!: number;
}