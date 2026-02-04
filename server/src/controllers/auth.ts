import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { encrypt, compare } from "../utils/handlePassword";
import { tokenSign } from "../utils/handleJwt";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// Simulación de envío de correo
// 2. Reemplaza la función sendVerificationEmail completa por esta:
const sendVerificationEmail = async (email: string, code: string) => {
  try {
    // Configuración del transporte (Gmail)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Lee del .env
        pass: process.env.EMAIL_PASS  // Lee del .env
      },
    });

    // Construir el link (mientras estés en desarrollo, sigue siendo localhost)
    const link = `http://localhost:5173/verify?code=${code}&email=${email}`;

    // Enviar el correo
    await transporter.sendMail({
      from: '"Soporte IngenIA-Q 🎓" <process.env.EMAIL_USER>', // Remitente
      to: email, // Destinatario
      subject: "Verifica tu cuenta en IngenIA-Q", // Asunto
      // Cuerpo del correo con HTML bonito
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #2563EB; text-align: center;">¡Bienvenido a IngenIA-Q! 🚀</h2>
                    <p style="color: #333; font-size: 16px;">
                        Hola, gracias por registrarte. Para comenzar a gestionar tu vida académica, por favor verifica tu correo electrónico.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${link}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                            Verificar mi Cuenta
                        </a>
                    </div>
                    <p style="color: #666; font-size: 12px; text-align: center;">
                        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                        <a href="${link}">${link}</a>
                    </p>
                    <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
                        Si no creaste esta cuenta, puedes ignorar este mensaje.
                    </p>
                </div>
            `,
    });

    console.log(`✅ Correo enviado correctamente a: ${email}`);

  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    // No lanzamos error para no detener el registro, pero lo logueamos
  }
};

// 1. REGISTRO
export const registerCtrl = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body;

    const checkIs = await prisma.user.findUnique({ where: { email } });
    if (checkIs) return res.status(409).send("El correo ya existe");

    const isInstitutional = email.endsWith("@uce.edu.ec");
    // Casteamos 'as any' para evitar bloqueos si TypeScript no se actualizó rápido
    const role = (isInstitutional ? "STUDENT" : "GUEST") as any;

    const passwordHash = await encrypt(password);
    const verificationCode = Math.random().toString(36).substring(2, 15);

    const registerUser = await prisma.user.create({
      data: {
        fullName,
        email,
        password: passwordHash,
        role,
        isVerified: false,
        verificationCode,
        provider: "LOCAL"
      } as any,
    });

    await sendVerificationEmail(email, verificationCode);

    res.send({
      message: "Usuario creado. Revisa tu consola del servidor para verificar.",
      user: { name: registerUser.fullName, email: registerUser.email }
    });

  } catch (e) {
    console.error("Error Registro:", e); // Log para ver el error real
    res.status(500).send("ERROR_REGISTER_USER");
  }
};

// 2. LOGIN
export const loginCtrl = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } }) as any;
    if (!user) return res.status(404).send("Usuario no encontrado");

    // Si es cuenta local, verificar pass
    if (user.provider === "LOCAL") {
      if (!user.password) return res.status(401).send("Cuenta de Google/GitHub. Usa el botón social.");

      const checkPassword = await compare(password, user.password); // 👈 Usamos compare
      if (!checkPassword) return res.status(401).send("Contraseña incorrecta");
    }

    // Verificar correo
    if (!user.isVerified) {
      return res.status(403).send("Cuenta no verificada. Revisa la consola del servidor para el link.");
    }

    const token = await tokenSign(user);
    const { password: _, verificationCode: __, ...userSafe } = user;

    res.send({ data: { token, user: userSafe } });

  } catch (e) {
    console.error("Error Login:", e);
    res.status(500).send("ERROR_LOGIN_USER");
  }
};

// 3. VERIFICAR (Necesario para el link del correo)
export const verifyEmailCtrl = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    const user = await prisma.user.findUnique({ where: { email } }) as any;

    if (!user) return res.status(404).send("Usuario no encontrado");
    if (user.verificationCode !== code) return res.status(400).send("Código inválido");

    await prisma.user.update({
      where: { email },
      data: { isVerified: true, verificationCode: null } as any
    });

    res.send({ message: "Verificado" });
  } catch (e) {
    res.status(500).send("ERROR_VERIFY");
  }
};

// 4. OAUTH (GOOGLE / GITHUB) -> AHORA CREA ESTUDIANTES
export const oauthLoginCtrl = async (req: Request, res: Response) => {
  try {
    const { email, fullName, provider } = req.body;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // 🔥 CAMBIO CLAVE: role es "STUDENT" directamente
      user = await prisma.user.create({
        data: {
          email,
          fullName,
          role: "STUDENT", // 👈 Antes era GUEST
          isVerified: true,
          provider: provider || "GOOGLE",
          password: "" // Sin password local
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

// 🔥 5. GET ME (DATOS DE SESIÓN) - ESTA ES LA CLAVE 🔥
// Esta función se llama cada vez que recargas la página para ver quién eres.
export const getMe = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        career: true // ✅ AQUÍ ESTÁ LA MAGIA: Incluye la carrera en la respuesta
      }
    });

    if (!user) return res.status(404).send("Usuario no encontrado");

    const { password, verificationCode, ...userSafe } = user;
    res.send({ user: userSafe });

  } catch (error) {
    console.error("Error en getMe:", error);
    res.status(500).send("ERROR_GET_ME");
  }
};