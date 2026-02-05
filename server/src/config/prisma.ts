import { PrismaClient } from "@prisma/client";

/**
 * Global Prisma Client instance.
 * * Exported as a singleton to ensure a single database connection pool 
 * is maintained throughout the application lifecycle.
 */
export const prisma = new PrismaClient();