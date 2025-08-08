import { signToken, verifyToken } from "../src/auth/jwt";

const token = signToken(42);
console.log("Signed:", token);

const decoded = verifyToken(token);
console.log("Decoded:", decoded);
