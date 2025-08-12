import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { StringValue } from "ms";

dotenv.config();

const secret = process.env.JWT_SECRET;
if (!secret) {
    throw new Error("Missing JWT_SECRET in environment");
}
export const SECRET: string = secret;

export interface BasicPayload {
    sub: number;
    iat: number;
    exp: number;
}

export interface AccessPayload {
    id: number;
    jwtSecureCode: string; // plain code from login (DB stores the bcrypt hash)
    iat: number;
    exp: number;
}

/** Legacy/simple token (not used for auth flow, but kept for compatibility) */
export function signToken(userId: number, expire: StringValue = "15m"): string {
    return jwt.sign({ sub: userId }, SECRET, { expiresIn: expire });
}
export function verifyToken(token: string): BasicPayload {
    return <any>jwt.verify(token, SECRET) as BasicPayload;
}

/** Main token used by the Google OAuth flow (matches the article pattern) */
export function signAccessToken(
    userId: number,
    jwtSecureCodePlain: string,
    expire: StringValue = "15m"
): string {
    return jwt.sign({ id: userId, jwtSecureCode: jwtSecureCodePlain }, SECRET, {
        expiresIn: expire,
    });
}
export function verifyAccessToken(token: string): AccessPayload {
    return jwt.verify(token, SECRET) as AccessPayload;
}
