import { UserService, userService } from "../services/user.service.js";
import { Request, Response, NextFunction } from "express";
import { validateBody } from "../../../common/utils/validator.js";
import { UpdateUserDto } from "../dto/user.dto.js";
import { AppError } from "../../../common/error/AppError.js";

export class UserController {
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;

        // Bind methods so `this` is preserved when passed directly as Express handlers
        this.getAll = this.getAll.bind(this);
        this.getById = this.getById.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(String(req.query.page), 10) || 1;
            const limit = parseInt(String(req.query.limit), 10) || 10;
            const role = req.query.role as string;
            const users = await this.userService.findAll(page, limit, role);
            res.status(200).json({ users });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(String(req.params.id), 10);
            if (isNaN(id)) throw new AppError("Invalid user id", 400);

            const user = await this.userService.findById(id);
            res.status(200).json({ user });
        } catch (error) {
            next(error);
        }
    }

    async updateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(String(req.params.id), 10);
            if (isNaN(id)) throw new AppError("Invalid user id", 400);

            if (req.user?.id !== id && req.user?.role !== 'admin') {
                throw new AppError("You are not allowed to update this user", 403);
            }

            const data = await validateBody(UpdateUserDto, req.body);
            const updated = await this.userService.update(id, data);

            res.status(200).json({ user: updated });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Soft-deletes a user by setting active = false.
     * The DB token is also revoked so any existing session is invalidated.
     */
    async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(String(req.params.id), 10);
            if (isNaN(id)) throw new AppError("Invalid user id", 400);

            if (req.user?.id !== id && req.user?.role !== 'admin') {
                throw new AppError("You are not allowed to delete this user", 403);
            }

            // Revoke DB refresh token before deactivating
            await this.userService.revokeTokenFromUser(id, "");

            const deleted = await this.userService.deleteUser(id);
            res.status(200).json({ message: "User deleted successfully", user: deleted });
        } catch (error) {
            next(error);
        }
    }
}

export const userController = new UserController(userService);
