import mongoose from "mongoose";

/**
 * Establishes a connection to the MongoDB database using Mongoose.
 * This connection is used for NoSQL data storage (e.g., chat logs, unstructured data).
 * * @returns {Promise<void>}
 */
const dbConnectNoSql = async (): Promise<void> => {
  try {
    const DB_URI = process.env.MONGO_URI;
    
    if (!DB_URI) {
      throw new Error("❌ MONGO_URI is not defined in the .env file");
    }

    await mongoose.connect(DB_URI);
    console.log("🟢 Successfully connected to MongoDB (ingenIA-Q NoSQL)");
  } catch (error) {
    console.error("🔴 Error connecting to MongoDB:", error);
    // process.exit(1); // Optional: Exit the application if the DB is critical
  }
};

export default dbConnectNoSql;