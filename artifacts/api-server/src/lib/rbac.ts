import type { Request, Response, NextFunction } from "express";

// ── Permission definitions ────────────────────────────────────────────────────
export type Permission =
  | "read:products"
  | "write:products"
  | "delete:products"
  | "read:own-orders"
  | "write:orders"
  | "read:all-orders"
  | "write:messages"
  | "read:shop-analytics"
  | "write:shop"
  | "read:affiliate-stats"
  | "write:affiliate-links"
  | "read:admin-panel"
  | "write:admin-actions"
  | "manage:roles"
  | "manage:users"
  | "read:inventory"
  | "write:inventory"
  | "read:shipments"
  | "write:shipments";

export type AppRole = "BUYER" | "SELLER" | "AFFILIATE" | "ADMIN";

// Map: permission → which roles have it
export const PERMISSION_MAP: Record<Permission, AppRole[]> = {
  "read:products":        ["BUYER", "SELLER", "AFFILIATE", "ADMIN"],
  "write:products":       ["SELLER", "ADMIN"],
  "delete:products":      ["SELLER", "ADMIN"],
  "read:own-orders":      ["BUYER", "SELLER", "ADMIN"],
  "write:orders":         ["BUYER", "ADMIN"],
  "read:all-orders":      ["ADMIN"],
  "write:messages":       ["BUYER", "SELLER", "AFFILIATE", "ADMIN"],
  "read:shop-analytics":  ["SELLER", "ADMIN"],
  "write:shop":           ["SELLER", "ADMIN"],
  "read:affiliate-stats": ["AFFILIATE", "ADMIN"],
  "write:affiliate-links":["AFFILIATE", "ADMIN"],
  "read:admin-panel":     ["ADMIN"],
  "write:admin-actions":  ["ADMIN"],
  "manage:roles":         ["ADMIN"],
  "manage:users":         ["ADMIN"],
  "read:inventory":       ["SELLER", "ADMIN"],
  "write:inventory":      ["SELLER", "ADMIN"],
  "read:shipments":       ["BUYER", "SELLER", "ADMIN"],
  "write:shipments":      ["SELLER", "ADMIN"],
};

// Role → dashboard redirect path
export const ROLE_DASHBOARD: Record<AppRole, string> = {
  ADMIN:     "/admin",
  SELLER:    "/seller/dashboard",
  AFFILIATE: "/affiliate/dashboard",
  BUYER:     "/buyer/dashboard",
};

// Priority order for dashboard redirect (highest wins)
export const ROLE_PRIORITY: AppRole[] = ["ADMIN", "SELLER", "AFFILIATE", "BUYER"];

// ── Helpers ──────────────────────────────────────────────────────────────────

export function roleHasPermission(role: AppRole, permission: Permission): boolean {
  return PERMISSION_MAP[permission]?.includes(role) ?? false;
}

export function rolesHavePermission(roles: AppRole[], permission: Permission): boolean {
  return roles.some(r => roleHasPermission(r, permission));
}

export function getPrimaryRole(roles: AppRole[]): AppRole {
  for (const r of ROLE_PRIORITY) {
    if (roles.includes(r)) return r;
  }
  return "BUYER";
}

export function getDashboardPath(roles: AppRole[]): string {
  const primary = getPrimaryRole(roles);
  return ROLE_DASHBOARD[primary];
}

// ── Middleware ────────────────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      userRoles?: AppRole[];
    }
  }
}

/**
 * requireAnyRole(...roles)
 * Passes if the authenticated user has AT LEAST ONE of the specified roles.
 * Works with the multi-role system (req.userRoles).
 * Falls back to req.userRole (single-role JWT) for backward compat.
 */
export function requireAnyRole(...roles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userRoles: AppRole[] = req.userRoles ?? (req.userRole ? [req.userRole as AppRole] : []);
    const hasRole = roles.some(r => userRoles.includes(r));

    if (!hasRole) {
      res.status(403).json({
        error: "Forbidden",
        required: roles,
        yourRoles: userRoles,
      });
      return;
    }
    next();
  };
}

/**
 * requirePermission(permission)
 * Passes if the user's roles grant the specified permission.
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userRoles: AppRole[] = req.userRoles ?? (req.userRole ? [req.userRole as AppRole] : []);
    const allowed = rolesHavePermission(userRoles, permission);

    if (!allowed) {
      res.status(403).json({
        error: "Forbidden",
        requiredPermission: permission,
        yourRoles: userRoles,
      });
      return;
    }
    next();
  };
}

/**
 * requireAllRoles(...roles)
 * Passes only if the user has ALL the specified roles simultaneously.
 */
export function requireAllRoles(...roles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userRoles: AppRole[] = req.userRoles ?? (req.userRole ? [req.userRole as AppRole] : []);
    const hasAll = roles.every(r => userRoles.includes(r));

    if (!hasAll) {
      res.status(403).json({
        error: "Forbidden",
        required: roles,
        yourRoles: userRoles,
      });
      return;
    }
    next();
  };
}
