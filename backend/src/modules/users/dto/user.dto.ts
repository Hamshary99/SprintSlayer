import { IsEmail, IsString, IsEnum, IsOptional, IsStrongPassword, IsNotEmpty } from 'class-validator';

export enum UserRole {
    ADMIN = 'admin',
    MEMBER = 'member'
}

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty({ message: "Email is required"})
    email!: string;

    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 0,
    }, {
        message: 'Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one number',
    })
    @IsNotEmpty({ message: "Password is required"})
    passwordHash!: string;

    @IsString()
    @IsNotEmpty({ message: "Name is required"})
    name!: string;

    @IsOptional()
    @IsEnum(UserRole)
    role: 'admin' | 'member' = 'member';
}

export class UpdateUserDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 0,
    }, {
        message: 'Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one number',
    })
    passwordHash?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: 'admin' | 'member';
}

export class UserLoginDto {
    @IsEmail()
    @IsNotEmpty({ message: "Email is required"})
    email!: string;

    @IsString()
    @IsNotEmpty({ message: "Password is required"})
    passwordHash!: string;
}

export class UpdatePasswordDto {
    @IsString()
    @IsNotEmpty({ message: "Current password is required" })
    currentPassword!: string;

    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 0,
    }, {
        message: 'Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one number',
    })
    @IsNotEmpty({ message: "New password is required" })
    newPassword!: string;
}