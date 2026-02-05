import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/handleJwt";
import { JwtPayload } from "jsonwebtoken";

// Interface for the raw data coming from the Token
interface TokenPayload extends JwtPayload {
    id?: number;
    _id?: number; // Legacy support
    role: string;
    email: string;
}

// Extend Express Request to include the standardized User object
export interface RequestExt extends Request {
    user?: {
        id: number;
        role: string;
        email: string;
    };
}

/**
 * Middleware to protect routes.
 * 1. Extracts the JWT from the Authorization header.
 * 2. Verifies the signature.
 * 3. Injects the user data into `req.user` for the controller to use.
 */
const checkJwt = async (req: RequestExt, res: Response, next: NextFunction) => {
    try {
        const jwtByUser = req.headers.authorization || "";
        const jwt = jwtByUser.split(" ").pop(); // Extract from "Bearer <token>"

        if (!jwt) {
            res.status(401).send("NO_TOKEN_PROVIDED");
            return;
        }

        const isUser = await verifyToken(`${jwt}`) as TokenPayload;

        if (!isUser) {
            res.status(401).send("INVALID_SESSION");
            return; 
        }
        
        // 🛠️ COMPATIBILITY TRICK:
        // We read 'id' (New System) or '_id' (Legacy/Mongo) and always save it as 'id'.
        // This ensures controllers don't break regardless of the token version.
        req.user = {
            id: isUser.id || isUser._id || 0,
            role: isUser.role,
            email: isUser.email
        };

        next();
    } catch (e) {
        console.error("SESSION_MIDDLEWARE_ERROR:", e);
        res.status(400).send("INVALID_SESSION_DATA");
    }
};

export { checkJwt };