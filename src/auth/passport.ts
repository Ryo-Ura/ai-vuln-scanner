import passport, { PassportStatic } from "passport";
import { googleStrategy } from "./google";
import { jwtAuthStrategy } from "./jwtStrategy";

export function initPassport(p: PassportStatic = passport) {
    p.use("google", googleStrategy);
    p.use("jwtAuth", jwtAuthStrategy);
}

export default passport;
