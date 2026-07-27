import 'dotenv/config';

function required(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required environment variable: ${key}`);
    return value;
}

export const env = {
    // Server
    PORT: Number(process.env.PORT) || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Database
    DB_HOST: required('DB_HOST'),
    DB_PORT: Number(process.env.DB_PORT) || 5432,
    DB_USER: required('DB_USER'),
    DB_PASSWORD: required('DB_PASSWORD'),
    DB_NAME: required('DB_NAME'),
    // Composed connection URL (used by Drizzle and health-check logs)
    get DATABASE_URL() {
        return `postgresql://${this.DB_USER}:${this.DB_PASSWORD}@${this.DB_HOST}:${this.DB_PORT}/${this.DB_NAME}`;
    },

    // JWT
    ACCESS_SECRET: required('ACCESS_SECRET'),
    REFRESH_SECRET: required('REFRESH_SECRET'),
    ACCESS_EXPIRE: (process.env.ACCESS_EXPIRE || '1h') as string,
    REFRESH_EXPIRE: (process.env.REFRESH_EXPIRE || '7d') as string,

    // Cookie max-ages (in milliseconds)
    ACCESS_COOKIES_EXPIRE: Number(process.env.ACCESS_COOKIES_EXPIRE) || 3600,
    REFRESH_COOKIES_EXPIRE: Number(process.env.REFRESH_COOKIES_EXPIRE) || 604800,
};
