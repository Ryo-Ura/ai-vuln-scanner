import crypto from "crypto";
import bcrypt from "bcryptjs";
import { signAccessToken, verifyAccessToken } from "../auth/jwt";

(async () => {
    const userId = 123;

    // Simulate "rotate secure code" on login
    const plain = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(plain, 10); // this would live in DB

    // Issue the token like our callback route will
    const token = signAccessToken(userId, plain);
    console.log("Access token:", token);

    // API side: verify signature & extract payload
    const payload = verifyAccessToken(token);
    console.log("Decoded payload:", payload);

    // Simulate jwtStrategy check: compare token's plain vs DB hash
    const ok = await bcrypt.compare(payload.jwtSecureCode, hash);
    console.log("Compare token->hash match (expected true):", ok);

    const bad = await bcrypt.compare("totally-wrong", hash);
    console.log("Compare wrong->hash match (expected false):", bad);
})();
