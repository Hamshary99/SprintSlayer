import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
    @IsEmail({}, { message: 'Must be a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email!: string;
}

export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty({ message: 'Token is required' })
    token!: string;

    @IsString()
    @IsNotEmpty({ message: 'New password is required' })
    @MinLength(6, { message: 'New password must be at least 6 characters long' })
    newPassword!: string;
}
