import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "token.01010101";

// 1. Generar el Token (Firmar)
const tokenSign = async (user: any) => {
  const sign = jwt.sign(
    {
      // CAMBIO CRÍTICO: PostgreSQL usa 'id', no '_id'.
      // Al cambiar esto aquí, todo tu sistema volverá a sincronizarse.
      id: user.id, 
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "2h", // Aumenté a 2h para que no te saque tan rápido en pruebas
    }
  );
  return sign;
};

// 2. Verificar el Token (Leer)
const verifyToken = async (tokenJwt: string) => {
  try {
    return jwt.verify(tokenJwt, JWT_SECRET);
  } catch (e) {
    return null;
  }
};

export { tokenSign, verifyToken };