import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/handleJwt";
import { JwtPayload } from "jsonwebtoken";

// Extendemos la definición de Request
interface RequestExt extends Request {
  user?: any;
}

const checkJwt = async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const jwtByUser = req.headers.authorization || "";
    const jwt = jwtByUser.split(" ").pop(); 

    if (!jwt) {
        res.status(401).send("NO_TIENES_TOKEN");
        return;
    }

    const isUser = await verifyToken(`${jwt}`) as JwtPayload;

    if (!isUser) {
      res.status(401).send("SESSION_INVALIDA");
      return; 
    }
    
    // TRUCO DE COMPATIBILIDAD:
    // Leemos 'id' (nuevo) o '_id' (viejo) y lo guardamos siempre como 'id'.
    // Esto hace que tus controladores funcionen sin importar qué token llegue.
    req.user = {
        id: isUser.id || isUser._id,
        role: isUser.role,
        email: isUser.email
    };

    next();
  } catch (e) {
    console.log("ERROR_SESSION_MIDDLEWARE:", e);
    res.status(400).send("SESSION_NO_VALIDA");
  }
};

export { checkJwt };