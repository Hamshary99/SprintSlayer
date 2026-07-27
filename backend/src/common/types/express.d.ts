import type { JwtPayload } from "../utils/jwt.util.js";

// This export {} makes this file a module, which is required for
// global declaration merging to work correctly in TypeScript.
export {};

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
