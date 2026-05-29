import { useGetMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { buildRolesFromUser, hasAnyRole, getDashboardPath, type AppRole } from "@/lib/auth/rbac";

interface ProtectedRouteProps {
  /** Roles that may access this route. If omitted, any authenticated user can access. */
  roles?: AppRole[];
  /** The page component to render when access is granted. */
  component: React.ComponentType;
  /** If true, logged-in users are redirected to their dashboard (used on auth pages). */
  guestOnly?: boolean;
}

/**
 * ProtectedRoute
 *
 * - Unauthenticated users → redirect to /auth/login
 * - Authenticated users without required role → redirect to their dashboard
 * - guestOnly=true → already-logged-in users are redirected to their dashboard
 */
export function ProtectedRoute({ roles, component: Component, guestOnly }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading, isError } = useGetMe({ query: { retry: false } });

  useEffect(() => {
    if (isLoading) return;

    // Guest-only pages (login, register): redirect logged-in users
    if (guestOnly && user) {
      const userRoles = buildRolesFromUser(user as any);
      setLocation(getDashboardPath(userRoles));
      return;
    }

    // Protected pages: redirect unauthenticated users
    if (!guestOnly && (isError || !user)) {
      const current = window.location.pathname + window.location.search;
      setLocation(`/auth/login?redirect=${encodeURIComponent(current)}`);
      return;
    }

    // Role-restricted pages: redirect users without required role
    if (roles && user) {
      const userRoles = buildRolesFromUser(user as any);
      if (!hasAnyRole(userRoles, ...roles)) {
        setLocation(getDashboardPath(userRoles));
      }
    }
  }, [user, isLoading, isError, roles, guestOnly, setLocation]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  // Guest-only page: don't render if user is logged in (redirect handled by useEffect)
  if (guestOnly && user) return null;

  // Protected page: don't render if unauthenticated
  if (!guestOnly && !user) return null;

  // Role check: don't render if role not satisfied
  if (roles && user) {
    const userRoles = buildRolesFromUser(user as any);
    if (!hasAnyRole(userRoles, ...roles)) return null;
  }

  return <Component />;
}

/**
 * RoleGate
 * Conditionally renders children based on the current user's roles.
 * Use inside pages for fine-grained UI visibility control.
 */
interface RoleGateProps {
  roles: AppRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { data: user } = useGetMe({ query: { retry: false } });
  if (!user) return <>{fallback}</>;
  const userRoles = buildRolesFromUser(user as any);
  return hasAnyRole(userRoles, ...roles) ? <>{children}</> : <>{fallback}</>;
}

/**
 * DashboardRedirect
 * Redirects users to their role-appropriate dashboard.
 * Use on a generic /dashboard route.
 */
export function DashboardRedirect() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe({ query: { retry: false } });

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setLocation("/auth/login");
      return;
    }
    const userRoles = buildRolesFromUser(user as any);
    setLocation(getDashboardPath(userRoles));
  }, [user, isLoading, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
