import dotenv from "dotenv";
dotenv.config();

import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { prisma } from "../core/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const CALLBACK_URL = `${
    process.env.BE_BASE_URL || "http://localhost:3000"
}/api/auth/google/callback`;

/**
 * Generates a fresh random code, hashes it with bcrypt, and returns both.
 * We store the hash in DB and put the plain code in the JWT payload.
 */
async function rotateUserSecureCode(userId: number) {
    const plain = crypto.randomBytes(32).toString("hex");
    const hashed = await bcrypt.hash(plain, 10);
    await prisma.user.update({
        where: { id: userId },
        data: { jwtSecureCode: hashed },
    });
    return { plain, hashed };
}

export const googleStrategy = new GoogleStrategy(
    {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
    },
    // verify callback
    async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done
    ) => {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error("Google profile missing email"));

            // find by googleId
            let user = await prisma.user.findUnique({
                where: { googleId: profile.id },
            });

            // if not found, create new user with a starter hash
            if (!user) {
                const starterPlain = crypto.randomBytes(32).toString("hex");
                const starterHash = await bcrypt.hash(starterPlain, 10);
                user = await prisma.user.create({
                    data: {
                        googleId: profile.id,
                        email,
                        jwtSecureCode: starterHash,
                    },
                });
            }

            // rotate code on every login (invalidates old tokens)
            const { plain } = await rotateUserSecureCode(user.id);

            // attach the plain value for the callback route to sign into the JWT
            // (not persisted; just passed along in req.user)
            return done(null, {
                id: user.id,
                email: user.email,
                jwtSecureCodePlain: plain,
            });
        } catch (err) {
            return done(err as Error);
        }
    }
);
