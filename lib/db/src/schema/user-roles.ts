import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userRolesTable = pgTable(
  "user_roles",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    role: text("role").notNull().$type<"BUYER" | "SELLER" | "AFFILIATE" | "ADMIN">(),
    grantedBy: text("granted_by").references(() => usersTable.id, { onDelete: "set null" }),
    grantedAt: timestamp("granted_at").notNull().defaultNow(),
  },
  (t) => [unique("user_roles_user_role_unique").on(t.userId, t.role)],
);

export type UserRole = typeof userRolesTable.$inferSelect;
