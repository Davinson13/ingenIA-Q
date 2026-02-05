import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { encrypt, compare } from "../utils/handlePassword";

// Interface to handle authenticated user data from middleware
interface RequestWithUser extends Request {
    user?: { id: number };
}

/**
 * Updates the authenticated user's profile.
 * - Allows updating 'fullName'.
 * - Handles password changes securely (verifying old password first).
 * - Blocks password changes for OAuth users (Google/GitHub).
 */
export const updateProfile = async (req: RequestWithUser, res: Response) => {
    try {
        const id = req.user?.id;
        if (!id) return res.status(401).send("Unauthorized");

        const { fullName, password, newPassword } = req.body;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Base update object (Name only initially)
        let updatedData: any = { fullName };

        // --- PASSWORD CHANGE LOGIC ---
        if (newPassword) {
            // 1. Block social accounts
            if (user.provider !== "LOCAL" && user.provider !== null) {
                return res.status(400).json({ 
                    error: "Your account is linked to Google/GitHub. You do not use a password." 
                });
            }

            // 2. Require current password
            if (!password) {
                return res.status(400).json({ error: "You must enter your current password to make changes." });
            }
            
            // 3. Verify current password
            if (user.password) {
                const isCorrect = await compare(password, user.password);
                if (!isCorrect) {
                    return res.status(403).json({ error: "Incorrect current password." });
                }
            }

            // 4. Encrypt new password
            updatedData.password = await encrypt(newPassword);
        }

        // Execute Update
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updatedData,
        });

        // Return safe user object (exclude sensitive fields)
        const { password: _, verificationCode: __, ...userSafe } = updatedUser;
        
        res.json({ message: "Profile updated successfully", user: userSafe });

    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ error: "Error updating profile" });
    }
};

/**
 * Permanently deletes the authenticated user's account.
 * Note: Prisma cascade delete logic in schema should handle related data cleanup.
 */
export const deleteAccount = async (req: RequestWithUser, res: Response) => {
    try {
        const id = req.user?.id;
        if (!id) return res.status(401).send("Unauthorized");
        
        await prisma.user.delete({ where: { id } });
        
        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ error: "Could not delete account. Please contact support." });
    }
};