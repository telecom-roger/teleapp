import { Request, Response, NextFunction } from "express";
import { User } from "express";

// Extend Express User interface
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
      clientId?: string;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: Express.User;
}

/**
 * Middleware para verificar se usuário está autenticado
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  next();
}

/**
 * Middleware para verificar role(s) específica(s)
 * @param roles Array de roles permitidas: 'admin', 'agent', 'customer'
 */
export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = req.user as any;

    if (!user || !user.role) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        error: "Acesso negado",
        message: "Você não tem permissão para acessar este recurso",
      });
    }

    next();
  };
}

/**
 * Middleware para bloquear clientes de acessarem áreas administrativas
 */
export function blockCustomers(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  const user = req.user as any;

  if (user && user.role === "customer") {
    return res.status(403).json({
      error: "Acesso negado",
      message:
        "Clientes não podem acessar o sistema administrativo. Acesse o painel do cliente em /ecommerce/painel",
    });
  }

  next();
}

/**
 * Middleware para garantir que apenas o próprio cliente acessa seus dados
 */
export function requireOwnData(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  const user = req.user as any;

  // Admin e agent podem acessar dados de qualquer cliente
  if (user.role === "admin" || user.role === "agent") {
    return next();
  }

  // Cliente só pode acessar seus próprios dados
  if (user.role === "customer") {
    const requestedClientId =
      req.params.clientId || req.query.clientId || req.body.clientId;

    if (requestedClientId && requestedClientId !== user.clientId) {
      return res.status(403).json({
        error: "Acesso negado",
        message: "Você só pode acessar seus próprios dados",
      });
    }
  }

  next();
}
