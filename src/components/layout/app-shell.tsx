"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Timer,
  Sparkles,
  Target,
  Wallet,
  Moon,
  Scale,
  FileBarChart,
  User,
  Bell,
  Shield,
  Download,
  Menu,
  X,
  Sun,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Daily",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Tasks", href: "/tasks", icon: CheckSquare },
      { name: "Calendar", href: "/calendar", icon: Calendar },
      { name: "Study Planner", href: "/study", icon: Timer },
    ],
  },
  {
    title: "Habits & Growth",
    items: [
      { name: "Habits", href: "/habits", icon: Sparkles },
      { name: "Goals", href: "/goals", icon: Target },
      { name: "Finances", href: "/finance", icon: Wallet },
      { name: "Sleep & Well-being", href: "/wellbeing", icon: Moon },
    ],
  },
  {
    title: "Insights",
    items: [
      { name: "Life Balance Score", href: "/balance", icon: Scale },
      { name: "Reports", href: "/reports", icon: FileBarChart },
    ],
  },
  {
    title: "Settings",
    items: [
      { name: "Profile", href: "/settings/profile", icon: User },
      { name: "Notifications", href: "/settings/notifications", icon: Bell },
      { name: "Security", href: "/settings/security", icon: Shield },
      { name: "Data & Privacy", href: "/settings/data", icon: Download },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);

  // Initialize theme from document or localStorage
  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
      localStorage.setItem("focusmate-theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
      localStorage.setItem("focusmate-theme", "dark");
    }
  };

  // Fetch authenticated user
  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || "Student");
        // Fetch unread notifications count
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false)
          .then(({ count }) => {
            if (count) setUnreadCount(count);
          });
      }
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card/60 backdrop-blur-sm lg:flex">
        {/* Brand Header */}
        <div className="flex h-16 items-center px-6 border-b border-border/70">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-charcoal text-white dark:bg-brand-mist dark:text-brand-charcoal font-bold text-sm tracking-wider">
              FM
            </div>
            <div>
              <span className="font-semibold text-brand-charcoal dark:text-brand-mist tracking-tight text-base">
                FocusMate
              </span>
              <span className="block text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                In Balance
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <h4 className="px-2 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
                {section.title}
              </h4>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-brand-mist/50 text-brand-charcoal dark:bg-brand-charcoal dark:text-brand-mist font-semibold shadow-xs"
                            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", isActive ? "text-brand-charcoal dark:text-brand-mist" : "text-muted-foreground")} />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-border/70">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-brand-charcoal dark:text-brand-mist">
                {userEmail || "Student"}
              </p>
              <p className="text-[11px] text-muted-foreground">FocusMate Active</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              title="Sign Out"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-background/80 px-4 sm:px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground capitalize">
                {pathname.split("/")[1] || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications Trigger */}
            <Link href="/settings/notifications">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-brand-charcoal dark:bg-brand-mist" />
                )}
              </Button>
            </Link>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative flex w-72 max-w-xs flex-1 flex-col bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="font-semibold text-brand-charcoal dark:text-brand-mist text-lg">
                  FocusMate
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex-1 overflow-y-auto pt-4 space-y-6">
                {navSections.map((section) => (
                  <div key={section.title}>
                    <h4 className="px-2 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {section.title}
                    </h4>
                    <ul className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                                isActive
                                  ? "bg-brand-mist/50 text-brand-charcoal dark:bg-brand-charcoal dark:text-brand-mist font-semibold"
                                  : "text-muted-foreground hover:bg-muted"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>

              <div className="pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
