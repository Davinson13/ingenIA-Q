import bcryptjs from "bcryptjs";

// 1. Encriptar contraseña (ej: "123456" -> "adjh12387asdh...")
const encrypt = async (passwordPlain: string) => {
  const hash = await bcryptjs.hash(passwordPlain, 10);
  return hash;
};

// 2. Comparar contraseña (Login)
const compare = async (passwordPlain: string, hashPassword: string) => {
  return await bcryptjs.compare(passwordPlain, hashPassword);
};

export { encrypt, compare };