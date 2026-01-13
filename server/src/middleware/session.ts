import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/handleJwt";
import { JwtPayload } from "jsonwebtoken";

// Extendemos la definición de Request para que acepte "user"
interface RequestExt extends Request {
  user?: string | JwtPayload;
}

const checkJwt = async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const jwtByUser = req.headers.authorization || "";
    const jwt = jwtByUser.split(" ").pop(); // Separa "Bearer" del token real

    const isUser = await verifyToken(`${jwt}`);

    if (!isUser) {
      res.status(401).send("SESSION_INVALIDA");
      return; 
    }
    
    // Inyectamos el usuario en la petición para usarlo en el controlador
    req.user = isUser;
    next();
  } catch (e) {
    console.log(e);
    res.status(400).send("SESSION_NO_VALIDA");
  }
};

export { checkJwt };