import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable, userRolesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { AppRole } from "./rbac.js";

const JWT_SECRET = process.env["SESSION_SECRET"] || "coastaq-dev-secret";

export interface JwtPayload {
  userId: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET + "_refresh", { expiresIn: "30d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET + "_refresh") as JwtPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Fetch all roles for a user from the user_roles table. */
export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const rows = await db
    .select({ role: userRolesTable.role })
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, userId));
  return rows.map(r => r.role as AppRole);
}

/** Ensure a user has an entry in user_roles for their primary role. */
export async function ensureUserRole(userId: string, role: AppRole, grantedBy?: string): Promise<void> {
  await db
    .insert(userRolesTable)
    .values({ userId, role, grantedBy: grantedBy || null })
    .onConflictDoNothing();
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      userRoles?: AppRole[];
    }
  }
}

/**
 * requireAuth middleware
 * Verifies the JWT, checks the user is not blocked, fetches all multi-roles,
 * and attaches userId, userRole (primary), and userRoles (all) to the request.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  let payload: JwtPayload;
  try {
    payload = verifyToken(token);
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  req.userId = payload.userId;
  req.userRole = payload.role;

  // DB check: blocked status + multi-roles (single query for both)
  Promise.all([
    db.select({ isBlocked: usersTable.isBlocked })
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1),
    db.select({ role: userRolesTable.role })
      .from(userRolesTable)
      .where(eq(userRolesTable.userId, payload.userId)),
  ])
    .then(([userRows, roleRows]) => {
      if (res.headersSent) return;

      const user = userRows[0];
      if (!user || user.isBlocked) {
        res.status(403).json({ error: "Account suspended" });
        return;
      }

      // Attach multi-roles; fall back to primary role from JWT if table is empty
      const dbRoles = roleRows.map(r => r.role as AppRole);
      req.userRoles = dbRoles.length > 0 ? dbRoles : [payload.role as AppRole];

      next();
    })
    .catch(() => {
      // On DB error, proceed with JWT role only (graceful degradation)
      req.userRoles = [payload.role as AppRole];
      next();
    });
}

/** Backward-compatible single-role check (checks primary JWT role). */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    // Check both multi-roles and primary role
    const userRoles = req.userRoles ?? (req.userRole ? [req.userRole] : []);
    const hasRole = roles.some(r => userRoles.includes(r));
    if (!hasRole) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export async function getUserWithShop(userId: string) {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
    with: { shop: true },
  });
  return user;
}
