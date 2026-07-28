import { UserRepository } from "../repositories/user.repository.js";
import { CreateUserDto, UpdateUserDto, UserLoginDto } from "../dto/user.dto.js";
import { hashPassword, comparePassword } from "../utils/password.hash.util.js";
import { generateAccessToken, generateRefreshToken } from "../../../common/utils/jwt.util.js";
import { AppError } from "../../../common/error/AppError.js";

export class UserService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    async create(data: CreateUserDto) {
        // 1. Check if user already exists
        const existingUser = await this.userRepository.findByEmail(data.email);
        if (existingUser.length > 0) {
            throw new AppError("User already exists", 409);
        }

        // 2. Hash Password
        const hashedPassword = await hashPassword(data.passwordHash);

        // 3. Create user
        const newUserArray = await this.userRepository.create({
            ...data,
            passwordHash: hashedPassword
        });
        const newUser = newUserArray[0];

        // 4. Generate JWT Tokens
        const payload = {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role as 'admin' | 'member'
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // 5. Save Refresh Token in Database
        await this.userRepository.update(newUser.id, { refreshToken });

        // 6. Return user without sensitive fields
        const { passwordHash: _, refreshToken: _rt, ...userData } = newUser;
        return { userData, accessToken, refreshToken };
    }

    async findAll(page: number = 1, limit: number = 10, role?: string) {
        // Hide Sensitive Data first
        const users = await this.userRepository.findAll(page, limit, role);
        return users.map((user) => {
            const { passwordHash, refreshToken, ...userData } = user;
            return userData;
        });
    }

    async findById(id: number) {
        // Hide Sensitive Data first
        const user = await this.userRepository.findById(id);
        if (user.length === 0) {
            throw new AppError("User not found", 404);
        }
        const { passwordHash, refreshToken, ...userData } = user[0];
        return userData;
    }

    async findByEmail(data: UserLoginDto) {
        // 1. Check if user exists
        const existingUser = await this.userRepository.findByEmail(data.email);
        if (existingUser.length === 0) {
            // Generic message to avoid user enumeration
            throw new AppError("Invalid credentials", 401);
        }

        // 2. Check if password matches
        const passwordMatch = await comparePassword(data.passwordHash, existingUser[0].passwordHash);
        if (!passwordMatch) {
            throw new AppError("Invalid credentials", 401);
        }

        // 3. Generate JWT Tokens
        const payload = {
            id: existingUser[0].id,
            email: existingUser[0].email,
            role: existingUser[0].role
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // 4. Save Refresh Token in Database
        await this.userRepository.update(existingUser[0].id, { refreshToken });

        // 5. Return user without sensitive fields
        const { passwordHash, refreshToken: _rt, ...userData } = existingUser[0];
        return { userData, accessToken, refreshToken };
    }

    async update(id: number, data: UpdateUserDto) {
        // 1. Check if User exists
        const existingUser = await this.userRepository.findById(id);
        if (existingUser.length === 0) {
            throw new AppError("User not found", 404);
        }

        // 2. Update user (passwordHash update is handled by updatePassword method)
        const { passwordHash, refreshToken, ...safeData } = data as UpdateUserDto & { refreshToken?: string };

        if (safeData.email) {
            const existingEmailUser = await this.userRepository.findByEmail(safeData.email);
            if (existingEmailUser.length > 0 && existingEmailUser[0].id !== id) {
                throw new AppError("Email is already in use by another account", 409);
            }
        }

        const updatedUsers = await this.userRepository.update(id, safeData);
        
        if (updatedUsers.length === 0) {
            throw new AppError("Failed to update user", 500);
        }

        // 3. Return user without sensitive fields
        const { passwordHash: _ph, refreshToken: _rt, ...userData } = updatedUsers[0];
        return userData;
    }

    async updatePassword(id: number, data: UpdateUserDto) {
        // 1. Check if User exists
        const existingUser = await this.userRepository.findById(id);
        if (existingUser.length === 0) {
            throw new AppError("User not found", 404);
        }

        // 2. Ensure new password is provided
        if (!data.passwordHash) {
            throw new AppError("Password is required to update password", 400);
        }

        // 3. Verify current password
        const match = await comparePassword(data.passwordHash, existingUser[0].passwordHash);
        if (!match) {
            throw new AppError("Incorrect current password", 401);
        }

        const hashedPassword = await hashPassword(data.passwordHash);

        return this.userRepository.update(id, { passwordHash: hashedPassword });
    }

    async updateRole(id: number, role: 'admin' | 'member') {
        const existingUser = await this.userRepository.findById(id);
        if (existingUser.length === 0) {
            throw new AppError("User not found", 404);
        }

        return this.userRepository.update(id, { role });
    }

    async revokeTokenFromUser(id: number, _refreshToken: string) {
        const existingUser = await this.userRepository.findById(id);
        if (existingUser.length === 0) {
            throw new AppError("User not found", 404);
        }

        return this.userRepository.update(id, { refreshToken: null });
    }

    async deleteUser(id: number) {
        const existingUser = await this.userRepository.findById(id);
        if (existingUser.length === 0) {
            throw new AppError("User not found", 404);
        }

        return this.userRepository.deleteUser(id);
    }
}

export const userService = new UserService();