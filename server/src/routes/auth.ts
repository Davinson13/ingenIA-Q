import { Router } from "express";
import { registerCtrl, loginCtrl } from "../controllers/auth";

const router = Router();

// http://localhost:3001/api/auth/register [POST]
router.post("/register", registerCtrl);

// http://localhost:3001/api/auth/login [POST]
router.post("/login", loginCtrl);

export { router };