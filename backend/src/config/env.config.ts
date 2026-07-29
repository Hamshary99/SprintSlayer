import 'dotenv/config';

function required(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required environment variable: ${key}`);
    return value;
}

export const env = {
    // Server
    PORT: Number(process.env.PORT) || 5000,
    NODE_ENV: process.env.NODE_ENV || 'dev',

    // Database
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: Number(process.env.DB_PORT) || 5432,
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'sprintslayer',
    // Composed connection URL (used by Drizzle and health-check logs)
    get DATABASE_URL(): string {
        if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
        if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
        return `postgresql://${this.DB_USER}:${this.DB_PASSWORD}@${this.DB_HOST}:${this.DB_PORT}/${this.DB_NAME}`;
    },

    // JWT
    ACCESS_SECRET: required('ACCESS_SECRET'),
    REFRESH_SECRET: required('REFRESH_SECRET'),
    ACCESS_EXPIRE: (process.env.ACCESS_EXPIRE || '1h').replace(/['"]/g, '') as string,
    REFRESH_EXPIRE: (process.env.REFRESH_EXPIRE || '7d').replace(/['"]/g, '') as string,

    // Cookie max-ages (in milliseconds)
    ACCESS_COOKIES_EXPIRE: Number(process.env.ACCESS_COOKIES_EXPIRE) || 3600000,
    REFRESH_COOKIES_EXPIRE: Number(process.env.REFRESH_COOKIES_EXPIRE) || 604800000,

    // Email & Frontend Links
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    EMAIL_FROM: process.env.EMAIL_FROM || 'SprintSlayer <onboarding@resend.dev>',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};
