import "dotenv/config";
import express from "express";
import cors from "cors";
import dbConnectNoSql from "./config/mongo";

// --- ROUTE IMPORTS ---
import { router as authRouter } from "./routes/auth";
import { router as careerRouter } from "./routes/career";
import { router as studentRouter } from "./routes/student";
import { router as aiRouter } from "./routes/ai"; 
import { router as teacherRouter } from "./routes/teacher"; // Renamed for consistency
import { router as adminRouter } from "./routes/admin";
import { router as userRouter } from "./routes/user"; // Renamed for consistency

// Initialize App
const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================================
// MIDDLEWARE CONFIGURATION
// =====================================================================

// CORS: Allow requests from Frontend (Vite)
app.use(cors({
  origin: [
    "http://localhost:5173",      // Localhost Standard
    "http://127.0.0.1:5173",      // Localhost IP
    process.env.CLIENT_URL || ""  // Docker/Production Fallback
  ], 
  credentials: true // Allow cookies/tokens
}));

// Body Parser
app.use(express.json());

// =====================================================================
// ROUTE REGISTRATION
// =====================================================================

app.use("/api/auth", authRouter);       // Authentication & Session
app.use("/api/career", careerRouter);   // Career Plans & Mesh
app.use("/api/student", studentRouter); // Student Dashboard & Actions
app.use("/api/ai", aiRouter);           // AI Assistant (Gemini)
app.use("/api/teacher", teacherRouter); // Teacher Dashboard & Tools
app.use("/api/admin", adminRouter);     // Administrative Panel
app.use("/api/user", userRouter);       // Profile Settings

// =====================================================================
// HEALTH CHECK
// =====================================================================
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    system: "IngenIA-Q Backend", 
    db_sql: "Connected (Prisma)",
    db_nosql: "Check Server Console Logs" 
  });
});

// =====================================================================
// SERVER START
// =====================================================================
app.listen(PORT, () => {
  console.log(`🚀 IngenIA-Q Server running at http://localhost:${PORT}`);
  
  // Connect to MongoDB (NoSQL) for Chat Logs/Unstructured Data
  dbConnectNoSql();
});