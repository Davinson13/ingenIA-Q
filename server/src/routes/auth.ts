import { Router } from "express";
import { registerCtrl, loginCtrl, verifyEmailCtrl, oauthLoginCtrl, getMe } from "../controllers/auth";
import { checkJwt } from "../middleware/session";

const router = Router();

// http://localhost:3001/api/auth/register [POST]
router.post("/register", registerCtrl);

// http://localhost:3001/api/auth/login [POST]
router.post("/login", loginCtrl);

router.post("/verify", verifyEmailCtrl);
router.post("/oauth", oauthLoginCtrl); 
// 🔥 ESTA RUTA ES LA QUE USA PROFILEPAGE
router.get("/me", checkJwt, getMe);

export { router };