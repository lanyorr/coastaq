// ── Role & permission types ───────────────────────────────────────────────────
export type AppRole = "BUYER" | "SELLER" | "AFFILIATE" | "ADMIN";

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

// Mirror of the server-side PERMISSION_MAP (client-side copy for UI decisions)
const PERMISSION_MAP: Record<Permission, AppRole[]> = {
  "read:products":         ["BUYER", "SELLER", "AFFILIATE", "ADMIN"],
  "write:products":        ["SELLER", "ADMIN"],
  "delete:products":       ["SELLER", "ADMIN"],
  "read:own-orders":       ["BUYER", "SELLER", "ADMIN"],
  "write:orders":          ["BUYER", "ADMIN"],
  "read:all-orders":       ["ADMIN"],
  "write:messages":        ["BUYER", "SELLER", "AFFILIATE", "ADMIN"],
  "read:shop-analytics":   ["SELLER", "ADMIN"],
  "write:shop":            ["SELLER", "ADMIN"],
  "read:affiliate-stats":  ["AFFILIATE", "ADMIN"],
  "write:affiliate-links": ["AFFILIATE", "ADMIN"],
  "read:admin-panel":      ["ADMIN"],
  "write:admin-actions":   ["ADMIN"],
  "manage:roles":          ["ADMIN"],
  "manage:users":          ["ADMIN"],
  "read:inventory":        ["SELLER", "ADMIN"],
  "write:inventory":       ["SELLER", "ADMIN"],
  "read:shipments":        ["BUYER", "SELLER", "ADMIN"],
  "write:shipments":       ["SELLER", "ADMIN"],
};

// Role → dashboard path (priority order determines redirect)
export const ROLE_DASHBOARD: Record<AppRole, string> = {
  ADMIN:     "/admin",
  SELLER:    "/seller",
  AFFILIATE: "/affiliate",
  BUYER:     "/account",
};

const ROLE_PRIORITY: AppRole[] = ["ADMIN", "SELLER", "AFFILIATE", "BUYER"];

// ── Helper functions ──────────────────────────────────────────────────────────

/** Returns true if any of the user's roles include the given role. */
export function hasRole(userRoles: AppRole[], role: AppRole): boolean {
  return userRoles.includes(role);
}

/** Returns true if the user has ALL the specified roles. */
export function hasAllRoles(userRoles: AppRole[], ...roles: AppRole[]): boolean {
  return roles.every(r => userRoles.includes(r));
}

/** Returns true if the user has ANY of the specified roles. */
export function hasAnyRole(userRoles: AppRole[], ...roles: AppRole[]): boolean {
  return roles.some(r => userRoles.includes(r));
}

/** Returns true if the user's roles grant the specified permission. */
export function hasPermission(userRoles: AppRole[], permission: Permission): boolean {
  const allowedRoles = PERMISSION_MAP[permission] ?? [];
  return userRoles.some(r => allowedRoles.includes(r));
}

/** Returns the highest-priority role for display or routing purposes. */
export function getPrimaryRole(userRoles: AppRole[]): AppRole {
  for (const r of ROLE_PRIORITY) {
    if (userRoles.includes(r)) return r;
  }
  return "BUYER";
}

/**
 * Returns the dashboard path the user should be redirected to
 * based on their highest-priority role.
 */
export function getDashboardPath(userRoles: AppRole[]): string {
  const primary = getPrimaryRole(userRoles);
  return ROLE_DASHBOARD[primary];
}

/**
 * Builds an AppRole[] array from a user object.
 * Handles both old single-role API responses and new multi-role responses.
 */
export function buildRolesFromUser(user: {
  role?: string;
  roles?: string[];
}): AppRole[] {
  if (user.roles && user.roles.length > 0) {
    return user.roles as AppRole[];
  }
  // Fallback: derive from primary role field
  if (user.role) {
    const primary = user.role as AppRole;
    const roles: AppRole[] = [primary];
    // Sellers also have implicit buyer access
    if (primary === "SELLER" && !roles.includes("BUYER")) roles.push("BUYER");
    return roles;
  }
  return ["BUYER"];
}

// ── Role display helpers ──────────────────────────────────────────────────────

export const ROLE_LABELS: Record<AppRole, string> = {
  BUYER:     "Buyer",
  SELLER:    "Seller",
  AFFILIATE: "Affiliate",
  ADMIN:     "Admin",
};

export const ROLE_COLORS: Record<AppRole, string> = {
  BUYER:     "bg-blue-100 text-blue-700",
  SELLER:    "bg-green-100 text-green-700",
  AFFILIATE: "bg-purple-100 text-purple-700",
  ADMIN:     "bg-red-100 text-red-700",
};
