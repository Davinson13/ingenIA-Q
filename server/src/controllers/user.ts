import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { encrypt, compare } from "../utils/handlePassword";

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { id } = (req as any).user;
    // Solo recibimos lo básico y seguridad
    const { fullName, password, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // Objeto base de actualización (Solo Nombre por ahora)
    let updatedData: any = { fullName };

    // --- LÓGICA DE CAMBIO DE CONTRASEÑA ---
    if (newPassword) {
      // 1. Si es usuario de Google, prohibido cambiar pass
      if (user.provider !== "LOCAL" && user.provider !== null) {
        return res.status(400).json({ 
            error: "Tu cuenta está vinculada a Google/GitHub. No usas contraseña." 
        });
      }

      // 2. Verificar que mandó la contraseña anterior
      if (!password) {
        return res.status(400).json({ error: "Debes ingresar tu contraseña actual para hacer cambios." });
      }
      
      // 3. Verificar que la contraseña anterior sea correcta
      if (user.password) {
        const isCorrect = await compare(password, user.password);
        if (!isCorrect) {
            return res.status(403).json({ error: "La contraseña actual es incorrecta." });
        }
      }

      // 4. Encriptar y guardar la nueva
      updatedData.password = await encrypt(newPassword);
    }

    // Actualizamos en la BD
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updatedData,
    });

    // Devolvemos el usuario limpio (sin pass)
    const { password: _, ...userSafe } = updatedUser;
    
    res.json({ message: "Perfil actualizado correctamente", user: userSafe });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { id } = (req as any).user;
    
    // Eliminación directa
    await prisma.user.delete({ where: { id } });
    
    res.json({ message: "Cuenta eliminada correctamente" });
  } catch (error) {
    console.error("Error eliminando cuenta:", error);
    res.status(500).json({ error: "No se pudo eliminar la cuenta." });
  }
};