import { Router, type Request, type Response } from "express";
import { db } from "./db";
import { users, clients } from "@shared/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import passport from "passport";
import { requireRole } from "./middleware/auth";

const router = Router();

/**
 * POST /api/ecommerce/auth/login
 * Login do cliente usando CPF/CNPJ ou email
 */
router.post("/login", async (req: Request, res: Response, next) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: "Identificador e senha são obrigatórios" });
  }

  try {
    // Identificar se é CPF/CNPJ ou email
    const cleanId = identifier.replace(/\D/g, ""); // Remove formatação
    const isDocument = cleanId.length === 11 || cleanId.length === 14;

    console.log("[E-commerce Login] Tentativa de login:", {
      identifier,
      cleanId,
      isDocument,
      length: cleanId.length,
    });

    let user;

    if (isDocument) {
      // Buscar cliente pelo CPF/CNPJ e depois o user vinculado
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.cnpj, cleanId))
        .limit(1);

      console.log("[E-commerce Login] Cliente encontrado:", client ? client.id : "Não encontrado");

      if (!client) {
        return res.status(401).json({ error: "CPF/CNPJ não encontrado no sistema" });
      }

      // Buscar user vinculado ao cliente
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.clientId, client.id))
        .limit(1);

      console.log("[E-commerce Login] User vinculado encontrado:", user ? user.id : "Não encontrado");
    } else {
      // Login por email
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, identifier))
        .limit(1);
    }

    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Verificar se é customer
    if (user.role !== "customer") {
      return res.status(403).json({ 
        error: "Acesso negado",
        message: "Acesse o sistema administrativo em /login" 
      });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Login via passport
    req.login(user as any, (err) => {
      if (err) {
        console.error("Erro no req.login:", err);
        return res.status(500).json({ error: "Erro ao fazer login" });
      }

      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          clientId: user.clientId,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    });
  } catch (error: any) {
    console.error("Erro no login do cliente:", error);
    res.status(500).json({ error: "Erro ao processar login" });
  }
});

/**
 * GET /api/ecommerce/auth/customer
 * Retorna dados do cliente logado
 */
router.get("/customer", requireRole(["customer"]), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    if (!user.clientId) {
      return res.status(400).json({ error: "Usuário não vinculado a um cliente" });
    }

    // Buscar dados completos do cliente
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, user.clientId))
      .limit(1);

    if (!client) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      client: {
        id: client.id,
        nome: client.nome,
        cnpj: client.cnpj,
        email: client.email,
        celular: client.celular,
        endereco: client.endereco,
        numero: client.numero,
        bairro: client.bairro,
        cidade: client.cidade,
        uf: client.uf,
        cep: client.cep,
      },
    });
  } catch (error: any) {
    console.error("Erro ao buscar dados do cliente:", error);
    res.status(500).json({ error: "Erro ao buscar dados" });
  }
});

/**
 * POST /api/ecommerce/auth/change-password
 * Trocar senha do cliente
 */
router.post("/change-password", requireRole(["customer"]), async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Senhas são obrigatórias" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Nova senha deve ter no mínimo 6 caracteres" });
  }

  try {
    const user = req.user as any;

    // Buscar user do banco
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Verificar senha atual
    const validPassword = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Senha atual incorreta" });
    }

    // Hash nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await db
      .update(users)
      .set({ passwordHash: hashedPassword })
      .where(eq(users.id, user.id));

    res.json({ success: true, message: "Senha alterada com sucesso" });
  } catch (error: any) {
    console.error("Erro ao alterar senha:", error);
    res.status(500).json({ error: "Erro ao alterar senha" });
  }
});

/**
 * POST /api/ecommerce/auth/logout
 * Logout do cliente
 */
router.post("/logout", (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao fazer logout" });
    }
    res.json({ success: true });
  });
});

export default router;
