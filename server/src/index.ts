import "dotenv/config";
import express from "express";
import cors from "cors";
import dbConnectNoSql from "./config/mongo"
import { router as authRouter } from "./routes/auth";
import { router as careerRouter } from "./routes/career";
import { router as studentRouter } from "./routes/student";
import { router as aiRouter } from "./routes/ai"; 

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