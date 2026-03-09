import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Users,
  LayoutDashboard,
  LogOut,
  Shield,
  Kanban,
} from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    user,
    role,
    signOut,
    impersonatedUserId,
    impersonatedUserEmail,
    impersonate,
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const navItems =
    role === "admin"
      ? [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/kanban", label: "Kanban", icon: Kanban },
          { to: "/admin", label: "Admin", icon: Shield },
        ]
      : [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/kanban", label: "Kanban", icon: Kanban },
          { to: "/manage", label: "My data", icon: Users },
        ];

  return (
    <div className="min-h-screen bg-background">
      {role === "admin" && impersonatedUserId && (
        <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-2">
          <span className="text-sm text-amber-800">
            Acting as:{" "}
            <strong>{impersonatedUserEmail ?? impersonatedUserId}</strong>
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-amber-300 text-amber-800 hover:bg-amber-100"
            onClick={() => impersonate(null)}
          >
            Stop
          </Button>
        </div>
      )}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 font-semibold text-foreground"
            >
              <Briefcase className="h-5 w-5 text-primary" />
              <span>RecruitFlow</span>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={
                      location.pathname === item.to ? "secondary" : "ghost"
                    }
                    size="sm"
                    className="gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            {role && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {role}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
