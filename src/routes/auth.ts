import { Router } from "express";
import passport from "passport";
import { signAccessToken } from "../auth/jwt";

const router = Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

// 1) Start Google OAuth flow
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
    })
);

// 2) Handle callback, issue JWT, redirect to FE with token
router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: `${FRONTEND_URL}/?error=login_failed`,
    }),
    (req, res) => {
        // google strategy put these on req.user
        const user = req.user as {
            id: number;
            email: string;
            jwtSecureCodePlain: string;
        };
        const accessToken = signAccessToken(
            user.id,
            user.jwtSecureCodePlain,
            "15m"
        );
        return res.redirect(`${FRONTEND_URL}/?accessToken=${accessToken}`);
    }
);

router.get(
    "/user",
    passport.authenticate("jwtAuth", { session: false }),
    (req, res) => {
        const user = req.user as { id: number; email: string };
        res.json({ id: user.id, email: user.email });
    }
);

export default router;
