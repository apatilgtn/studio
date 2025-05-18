
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  title?: string; // Title is now optional
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [ // "Home" is effectively the first group without an explicit title
      { href: "/", label: "Import / Overview", icon: Icons.Home },
      { href: "/dashboard", label: "API Dashboard", icon: Icons.LayoutDashboard },
    ],
  },
  {
    title: "API TOOLS",
    items: [
      { href: "/documentation", label: "View API Doc", icon: Icons.BookOpen },
      { href: "/dependency-graph", label: "Dependency Graph", icon: Icons.GitFork },
    ],
  },
  {
    title: "AI SUITE",
    items: [
      { href: "/generate-documentation", label: "Generate API Doc", icon: Icons.FilePlus2 },
      { href: "/integration-analysis", label: "Integration Analysis", icon: Icons.Palette },
      { href: "/live-api-discovery", label: "Live API Discovery", icon: Icons.Webhook },
      { href: "/api-discovery-scanner", label: "API Discovery Scanner", icon: Icons.Radar },
      { href: "/health-monitoring", label: "Health Monitoring", icon: Icons.Activity },
      { href: "/predictive-monitoring", label: "Predictive Monitoring", icon: Icons.TrendingUp },
      { href: "/vulnerability-scan", label: "Vulnerability Scan", icon: Icons.ShieldAlert },
      { href: "/compliance-check", label: "Compliance Check", icon: Icons.ShieldCheck },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { href: "/settings", label: "Settings", icon: Icons.Settings },
      // { href: "/integrations", label: "Integrations", icon: Icons.Blend }, 
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex h-full w-60 flex-col border-r bg-sidebar text-sidebar-foreground shadow-lg">
      <Link
        href="/"
        className="group mb-2 flex h-16 items-center justify-start gap-3 border-b border-sidebar-border px-4 py-3 text-lg font-bold text-primary shadow-sm"
        aria-label="API Harmony Lite Home"
      >
        <Icons.Zap className="h-6 w-6 shrink-0 transition-all group-hover:scale-110 text-primary-foreground bg-primary p-1 rounded-md" />
        <span className="font-semibold text-primary">API Harmony</span>
      </Link>
      <nav className="flex flex-col gap-1 px-3 py-4 overflow-y-auto">
        {navGroups.map((group, groupIndex) => (
          <div key={group.title || `group-${groupIndex}`} className="mb-2 last:mb-0">
            {group.title && (
              <h4 className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                {group.title}
              </h4>
            )}
            {group.items.map((item) => (
              <Link href={item.href} key={item.href} legacyBehavior passHref>
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left h-9 px-3 py-2 mb-0.5", // Reduced height and margin
                    pathname === item.href
                      ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 shadow-sm" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  aria-label={item.label}
                >
                  <item.icon className="mr-2.5 h-4 w-4 shrink-0" /> {/* Slightly smaller icon margin */}
                  <span className="text-xs font-medium">{item.label}</span> {/* Smaller text */}
                </Button>
              </Link>
            ))}
            {groupIndex < navGroups.length - 1 && group.title && <Separator className="my-2 bg-sidebar-border/70" />}
          </div>
        ))}
      </nav>
      {/* Optional "Getting Started" link at the bottom */}
      {/* <div className="mt-auto p-4 border-t border-sidebar-border">
        <Button variant="outline" className="w-full text-xs">
          <Icons.Rocket className="mr-2 h-4 w-4" /> Getting Started
        </Button>
      </div> */}
    </aside>
  );
}
