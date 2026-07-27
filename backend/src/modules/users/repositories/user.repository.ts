import { db } from "../../../db/db.js";
import { users } from "../schemas/user.schema.js";
import { eq, and } from "drizzle-orm";
import { CreateUserDto, UpdateUserDto } from "../dto/user.dto.js";

export class UserRepository {
    async create(data: CreateUserDto) {
        return db.insert(users).values(data).returning();
    }

    async findAll(page: number = 1, limit: number = 10, role?: string) {
        const conditions = [eq(users.active, true)];
        
        if (role) {
            conditions.push(eq(users.role, role as any));
        }
        
        let query = db.select().from(users).where(and(...conditions));
        
        return query.limit(limit).offset((page - 1) * limit);
    }

    async findById(id: number) {
        return db.select().from(users).where(eq(users.id, id));
    }

    async findByEmail(email: string) {
        return db.select().from(users).where(eq(users.email, email));
    }

    async update(id: number, data: UpdateUserDto | { refreshToken: string | null }) {
        return db.update(users).set(data).where(eq(users.id, id)).returning();
    }

    async deleteUser(id: number) {
        return db.update(users).set({ active: false }).where(eq(users.id, id)).returning();
    }

    async findUserByToken(refreshToken: string) {
        return db.select().from(users).where(eq(users.refreshToken, refreshToken));
    }
}