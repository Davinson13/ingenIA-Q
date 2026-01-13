import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { compare, encrypt } from "../utils/handlePassword";
import { tokenSign } from "../utils/handleJwt";

const prisma = new PrismaClient();

// LOGICA DE REGISTRO
const registerCtrl = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role } = req.body;

    // 1. Verificar si ya existe
    const checkIs = await prisma.user.findUnique({ where: { email } });
    if (checkIs) return res.status(409).send("ALREADY_USER");

    // 2. Encriptar contraseña
    const passwordHash = await encrypt(password);

    // 3. Crear usuario
    const registerUser = await prisma.user.create({
      data: {
        email,
        fullName,
        password: passwordHash,
        role: role || "STUDENT"
      }
    });

    res.send({ data: registerUser });
  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_REGISTER_USER");
  }
};

// LOGICA DE LOGIN
const loginCtrl = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Buscar usuario por email
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      res.status(404).send("USER_NOT_FOUND");
      return;
    }

    // 2. Comparar contraseña
    const checkPassword = await compare(password, user.password);

    if (!checkPassword) {
      res.status(401).send("PASSWORD_INCORRECT");
      return;
    }

    // 3. Si todo ok, generar Token
    const tokenJwt = await tokenSign(user);

    // 4. Responder al Frontend (ocultando la contraseña)
    res.send({
      data: {
        token: tokenJwt,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_LOGIN_USER");
  }
};

export { registerCtrl, loginCtrl };