import { db } from "../../../db/db.js";
import { users } from "../schemas/user.schema.js";
import { eq, and, asc, desc, ilike, or } from "drizzle-orm";
import { CreateUserDto, UpdateUserDto } from "../dto/user.dto.js";

export type UserSortField = "id" | "name" | "email" | "role" | "createdAt";
export type SortOrder = "asc" | "desc";

const getOrderClause = (
    sortBy: UserSortField = "createdAt",
    sortOrder: SortOrder = "desc"
) => {
    const column =
        {
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
        }[sortBy] || users.createdAt;

    return sortOrder === "asc" ? asc(column) : desc(column);
};

export class UserRepository {
    async create(data: CreateUserDto) {
        return db.insert(users).values(data).returning();
    }

    async findAll(
        page: number = 1,
        limit: number = 10,
        role?: string,
        sortBy?: UserSortField,
        sortOrder?: SortOrder,
        search?: string,
    ) {
        const conditions = [eq(users.active, true)];
        
        if (role) {
            conditions.push(eq(users.role, role as any));
        }

        if (search && search.trim()) {
            const term = `%${search.trim()}%`;
            conditions.push(or(ilike(users.name, term), ilike(users.email, term))!);
        }
        
        return db
            .select()
            .from(users)
            .where(and(...conditions))
            .orderBy(getOrderClause(sortBy, sortOrder))
            .limit(limit)
            .offset((page - 1) * limit);
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