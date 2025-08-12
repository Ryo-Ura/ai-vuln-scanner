import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { SECRET } from "./jwt";
import { prisma } from "../core/prisma";
import bcrypt from "bcryptjs";

type JwtPayload = {
    id: number;
    jwtSecureCode: string;
    iat: number;
    exp: number;
};

export const jwtAuthStrategy = new JwtStrategy(
    {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: SECRET,
    },
    async (payload: JwtPayload, done) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: payload.id },
            });
            if (!user) return done(null, false);

            // compare plain from token vs bcrypt hash in DB
            const ok = await bcrypt.compare(
                payload.jwtSecureCode,
                user.jwtSecureCode
            );
            if (!ok) return done(null, false);

            // minimal req.user
            return done(null, { id: user.id, email: user.email });
        } catch (err) {
            return done(err as Error, false);
        }
    }
);
