import { Router } from "express";
import { updateProfile, deleteAccount } from "../controllers/user";
import { checkJwt } from "../middleware/session";

const router = Router();

router.put("/profile", checkJwt, updateProfile);
router.delete("/profile", checkJwt, deleteAccount);

export { router };