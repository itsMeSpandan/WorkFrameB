"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const employeeLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/attendance", label: "Attendance" },
  { href: "/leave", label: "Leave" },
];

const adminLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/employees", label: "Employees" },
  { href: "/attendance", label: "Attendance" },
  { href: "/leave", label: "Leave Approvals" },
  { href: "/profile", label: "My Profile" },
];

export default function Navbar() {
  const { user, signout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const links = user.role === "ADMIN" ? adminLinks : employeeLinks;

  return (
    <nav className="bg-surface-raised border-b border-surface-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-heading text-lg font-bold tracking-tight text-foreground-primary uppercase">
              WorkFrame
            </span>
            <span className="hidden sm:inline label-tactical bg-accent/10 text-accent px-2 py-0.5">
              {user.role}
            </span>
          </Link>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-xs font-medium uppercase tracking-tactical transition-colors ${
                  pathname === link.href
                    ? "text-accent bg-accent/10"
                    : "text-foreground-secondary hover:text-foreground-primary hover:bg-surface-overlay"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User info + sign out */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-foreground-muted font-mono">
              {user.email}
            </span>
            <button
              onClick={signout}
              className="text-xs font-medium uppercase tracking-tactical text-foreground-muted hover:text-danger transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-0.5 pb-2 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-tactical whitespace-nowrap transition-colors ${
                pathname === link.href
                  ? "text-accent bg-accent/10"
                  : "text-foreground-secondary hover:text-foreground-primary hover:bg-surface-overlay"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
