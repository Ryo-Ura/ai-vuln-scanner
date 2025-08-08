import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const _secret = process.env.JWT_SECRET;
if (!_secret) {
    throw new Error("Missing JWT_SECRET in environment");
}
export const SECRET: string = _secret;


interface TokenPayload {
    sub: number;
}

/**
 * Sign a JWT for the given user ID.
 * @param userId - the database User.id
 * @returns a signed JWT string, expires in 15 minutes
 */
export function signToken(userId: number): string {
    const payload: TokenPayload = { sub: userId };
    return jwt.sign(payload, SECRET, { expiresIn: '15m' });
}

/**
 * Verify a JWT string.
 * @param token - the JWT to verify
 * @returns the decoded payload ({ sub: userId })
 * @throws if the token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
    return <any>jwt.verify(token, SECRET) as TokenPayload;
}
