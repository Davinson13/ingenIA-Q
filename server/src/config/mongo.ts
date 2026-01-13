import mongoose from "mongoose";

const dbConnectNoSql = async (): Promise<void> => {
  try {
    const DB_URI = process.env.MONGO_URI;
    
    if (!DB_URI) {
      throw new Error("❌ MONGO_URI no está definida en el archivo .env");
    }

    await mongoose.connect(DB_URI);
    console.log("🟢 Conexión exitosa a MongoDB (ingenIA-Q NoSQL)");
  } catch (error) {
    console.error("🔴 Error conectando a MongoDB:", error);
  }
};

export default dbConnectNoSql;