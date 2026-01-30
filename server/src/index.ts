import "dotenv/config";
import express from "express";
import cors from "cors";
import dbConnectNoSql from "./config/mongo"
import { router as authRouter } from "./routes/auth";
import { router as careerRouter } from "./routes/career";
import { router as studentRouter } from "./routes/student";
import { router as aiRouter } from "./routes/ai"; 
import { router as teacherRoutes } from "./routes/teacher";
import { router as adminRouter } from "./routes/admin";
import { router as guestRouter } from "./routes/guest";

// Inicializar la App
const app = express();
const PORT = process.env.PORT || 3001;

// CAMBIA LA LÍNEA DE CORS POR ESTO:
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"], // Permitir al Frontend de Vite
  credentials: true // Permitir cookies/tokens
}));

app.use(express.json());


app.use("/api/auth", authRouter);
app.use("/api/career", careerRouter); 
app.use("/api/student", studentRouter);
app.use("/api/ai", aiRouter);
app.use("/api/teacher", teacherRoutes);
app.use("/api/admin", adminRouter);
app.use("/api/guest", guestRouter);

// 1. Ruta de prueba (Health Check)
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    system: "ingenIA-Q Backend", 
    db_sql: "Conectado (Prisma)",
    db_nosql: "Verificar logs consola" 
  });
});

// 2. Arrancar Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ingenIA-Q corriendo en http://localhost:${PORT}`);
  
  // 3. Conectar MongoDB al iniciar
  dbConnectNoSql();
});