import { Router } from "express";
import { registerCtrl, loginCtrl, verifyEmailCtrl, oauthLoginCtrl } from "../controllers/auth";

const router = Router();

// http://localhost:3001/api/auth/register [POST]
router.post("/register", registerCtrl);

// http://localhost:3001/api/auth/login [POST]
router.post("/login", loginCtrl);

router.post("/verify", verifyEmailCtrl);
router.post("/oauth", oauthLoginCtrl); 

export { router };