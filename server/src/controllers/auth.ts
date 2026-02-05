import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { encrypt, compare } from "../utils/handlePassword";
import { tokenSign } from "../utils/handleJwt";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// Interface for requests that have passed through auth middleware
interface RequestWithUser extends Request {
    user?: {
        id: number;
        role: string;
        email: string;
    };
}

// =====================================================================
// HELPER: EMAIL SENDER
// =====================================================================

/**
 * Sends a verification email to the user using Nodemailer.
 * Configured for Gmail service based on environment variables.
 */
const sendVerificationEmail = async (email: string, code: string) => {
    try {
        // Transporter Configuration
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
        });

        // Construct Verification Link
        // Uses env variable for production compatibility, defaults to localhost for dev
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const link = `${clientUrl}/verify?code=${code}&email=${email}`;

        // Send Email
        await transporter.sendMail({
            from: `"IngenIA-Q Support 🎓" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Verify your IngenIA-Q Account",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #2563EB; text-align: center;">Welcome to IngenIA-Q! 🚀</h2>
                    <p style="color: #333; font-size: 16px;">
                        Hello! Thanks for registering. To start managing your academic life, please verify your email address.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${link}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                            Verify My Account
                        </a>
                    </div>
                    <p style="color: #666; font-size: 12px; text-align: center;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="${link}">${link}</a>
                    </p>
                    <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
                        If you didn't create this account, you can safely ignore this email.
                    </p>
                </div>
            `,
        });

        console.log(`✅ Verification email sent successfully to: ${email}`);

    } catch (error) {
        console.error("❌ Error sending email:", error);
        // We log the error but don't stop the registration process
    }
};

// =====================================================================
// 1. REGISTRATION
// =====================================================================

/**
 * Handles user registration.
 * Checks for existing email, hashes password, assigns initial role, and triggers verification email.
 */
export const registerCtrl = async (req: Request, res: Response) => {
    try {
        const { fullName, email, password } = req.body;

        // Check if user exists
        const checkIs = await prisma.user.findUnique({ where: { email } });
        if (checkIs) return res.status(409).send("Email already exists");

        // Determine Role (Institutional email = STUDENT, otherwise GUEST)
        const isInstitutional = email.endsWith("@uce.edu.ec");
        const role = isInstitutional ? "STUDENT" : "GUEST";

        const passwordHash = await encrypt(password);
        const verificationCode = Math.random().toString(36).substring(2, 15);

        // Create User
        const registerUser = await prisma.user.create({
            data: {
                fullName,
                email,
                password: passwordHash,
                role: role as any, // Cast to any to satisfy Prisma Enum if strictly typed
                isVerified: false,
                verificationCode,
                provider: "LOCAL"
            },
        });

        // Send Email
        await sendVerificationEmail(email, verificationCode);

        res.send({
            message: "User created. Please check your email (or server console) to verify.",
            user: { name: registerUser.fullName, email: registerUser.email }
        });

    } catch (e) {
        console.error("Registration Error:", e);
        res.status(500).send("ERROR_REGISTER_USER");
    }
};

// =====================================================================
// 2. LOGIN
// =====================================================================

/**
 * Handles local user login.
 * Verifies credentials and checking if the account is verified.
 */
export const loginCtrl = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).send("User not found");

        // If Local Provider, verify password
        if (user.provider === "LOCAL") {
            if (!user.password) return res.status(401).send("This is a Social Account (Google/GitHub). Please use the social login button.");

            const checkPassword = await compare(password, user.password);
            if (!checkPassword) return res.status(401).send("Incorrect password");
        }

        // Verify Account Status
        if (!user.isVerified) {
            return res.status(403).send("Account not verified. Please check your email.");
        }

        // Generate JWT
        const token = await tokenSign(user);
        
        // Remove sensitive data
        const { password: _, verificationCode: __, ...userSafe } = user;

        res.send({ data: { token, user: userSafe } });

    } catch (e) {
        console.error("Login Error:", e);
        res.status(500).send("ERROR_LOGIN_USER");
    }
};

// =====================================================================
// 3. VERIFY EMAIL
// =====================================================================

/**
 * Verifies a user account using the code sent via email.
 */
export const verifyEmailCtrl = async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return res.status(404).send("User not found");
        if (user.verificationCode !== code) return res.status(400).send("Invalid verification code");

        await prisma.user.update({
            where: { email },
            data: { isVerified: true, verificationCode: null }
        });

        res.send({ message: "Account successfully verified" });
    } catch (e) {
        res.status(500).send("ERROR_VERIFY");
    }
};

// =====================================================================
// 4. OAUTH (GOOGLE / GITHUB)
// =====================================================================

/**
 * Handles Social Login/Registration.
 * If user doesn't exist, creates a new one with 'STUDENT' role by default.
 */
export const oauthLoginCtrl = async (req: Request, res: Response) => {
    try {
        const { email, fullName, provider } = req.body;

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Create new user automatically
            user = await prisma.user.create({
                data: {
                    email,
                    fullName,
                    role: "STUDENT", // Default role for social login
                    isVerified: true, // Social accounts are trusted
                    provider: provider || "GOOGLE",
                    password: "" // No local password
                } as any
            });
        }

        const token = await tokenSign(user);
        res.send({ data: { token, user } });

    } catch (e) {
        console.error(e);
        res.status(500).send("ERROR_OAUTH");
    }
};

// =====================================================================
// 5. GET CURRENT USER (SESSION)
// =====================================================================

/**
 * Retrieves the current authenticated user's details.
 * Crucial for session persistence on frontend refresh.
 * Includes 'career' data to load the dashboard correctly.
 */
export const getMe = async (req: RequestWithUser, res: Response) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).send("Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                career: true // ✅ Includes career data for the dashboard
            }
        });

        if (!user) return res.status(404).send("User not found");

        // Filter sensitive data
        const { password, verificationCode, ...userSafe } = user;
        res.send({ user: userSafe });

    } catch (error) {
        console.error("Error in getMe:", error);
        res.status(500).send("ERROR_GET_ME");
    }
};