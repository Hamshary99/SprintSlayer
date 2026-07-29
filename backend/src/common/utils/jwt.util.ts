import jwt, { SignOptions } from 'jsonwebtoken';
import { CookieOptions, Response } from 'express';
import { env } from '../../config/env.config.js';

// In General I would prefer making a whole new table for refresh tokens for each user to be able to login from many devices. 
// But since the user table already has a refresh token column and this is a uni-user only app
// I'll use the user table to store the refresh token
// So that I can have a direct way to lookup refresh tokens.

export interface JwtPayload {
    id: number;
    role: string;
    email: string;
}

export interface SetCookiesOptions extends CookieOptions {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: boolean | "lax" | "strict" | "none";
}

export function generateAccessToken(payload: JwtPayload): string {
    const options: SignOptions = {
        expiresIn: env.ACCESS_EXPIRE as SignOptions["expiresIn"]
    }
    return jwt.sign(payload, env.ACCESS_SECRET, options);
}

export function generateRefreshToken(payload: JwtPayload): string {
    const options: SignOptions = {
        expiresIn: env.REFRESH_EXPIRE as SignOptions["expiresIn"]
    }
    return jwt.sign(payload, env.REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, env.ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, env.REFRESH_SECRET) as JwtPayload;
}

export const setAccessTokenCookie = (res: Response, token: string, options?: SetCookiesOptions) => {
    const isProd = env.NODE_ENV === "production" || env.NODE_ENV === "prod" || env.NODE_ENV === "staging";
    const defaultOptions: SetCookiesOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: '/',
        maxAge: env.ACCESS_COOKIES_EXPIRE
    }
    const cookieOptions = { ...defaultOptions, ...options };
    return res.cookie("access_token", token, cookieOptions);
}

export const setRefreshTokenCookie = (res: Response, token: string, options?: SetCookiesOptions) => {
    const isProd = env.NODE_ENV === "production" || env.NODE_ENV === "prod" || env.NODE_ENV === "staging";
    const defaultOptions: SetCookiesOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: '/',
        maxAge: env.REFRESH_COOKIES_EXPIRE
    }
    const cookieOptions = { ...defaultOptions, ...options };
    return res.cookie("refresh_token", token, cookieOptions);
}

export const clearTokensCookies = (res: Response) => {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
}