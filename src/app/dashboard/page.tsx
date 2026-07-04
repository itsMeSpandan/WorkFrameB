"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";
import LoadingSpinner from "@/components/LoadingSpinner";

interface ProfileData {
  employeeId: string;
  profile: {
    fullName: string;
    jobTitle: string | null;
    department: string | null;
  } | null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function ActionCard({
  href,
  icon,
  title,
  description,
  primary = false,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative block p-6 border transition-all duration-200 ${
        primary
          ? "border-accent/30 bg-accent/[0.04] hover:border-accent/60 hover:bg-accent/[0.08]"
          : "border-surface-border bg-surface-raised hover:border-foreground-muted/40 hover:bg-surface-overlay/50"
      } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
      aria-label={`Go to ${title}`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-4 transition-colors duration-200 ${
          primary
            ? "bg-accent/15 text-accent group-hover:bg-accent/25"
            : "bg-surface-overlay text-foreground-secondary group-hover:bg-surface-border/60 group-hover:text-foreground-primary"
        }`}
      >
        {icon}
      </div>
      <h3
        className={`text-sm font-semibold tracking-tight mb-1 transition-colors duration-200 ${
          primary
            ? "text-accent group-hover:text-accent-hover"
            : "text-foreground-primary group-hover:text-foreground-primary"
        }`}
      >
        {title}
      </h3>
      <p className="text-xs text-foreground-muted leading-relaxed">{description}</p>
      {/* Accent underline on hover */}
      <span
        className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-300 ${
          primary ? "bg-accent" : "bg-foreground-muted/40"
        }`}
      />
    </Link>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setCurrentTime(getCurrentTime());
    const interval = setInterval(() => setCurrentTime(getCurrentTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    apiFetch<ProfileData>("/api/me/profile")
      .then(setProfile)
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [user]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) return null;

  const firstName = profile?.profile?.fullName?.split(" ")[0] || user.email.split("@")[0];
  const roleLabel = user.role === "ADMIN" ? "Administrator" : "Team Member";
  const department = profile?.profile?.department || "";
  const jobTitle = profile?.profile?.jobTitle || "";

  const initials = (profile?.profile?.fullName || user.email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Attendance is the most frequent daily action — make it visually primary
  const actions = [
    {
      href: "/attendance",
      icon: "⏱",
      title: "Attendance",
      description: "Check in, track hours, and view your attendance history.",
      primary: true,
    },
    {
      href: "/time-off",
      icon: "📅",
      title: "Time Off",
      description: "Request leave and check the status of your applications.",
    },
    {
      href: "/payroll",
      icon: "💰",
      title: "My Payroll",
      description: "View salary details and download your payslips.",
    },
    {
      href: "/profile",
      icon: "👤",
      title: "My Profile",
      description: "Manage your personal information and preferences.",
    },
  ];

  return (
    <div className="min-h-screen bg-surface-base">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* ── Greeting Section ── */}
        <div className="mb-12">
          <div className="flex items-start gap-5">
            {/* Initials avatar with presence dot */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center">
                <span className="font-heading text-lg font-bold text-accent tracking-tight">
                  {initials}
                </span>
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-success border-2 border-surface-base" />
            </div>

            <div className="min-w-0">
              {/* Greeting name — the emotional anchor */}
              <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground-primary">
                {getGreeting()}, {firstName}
              </h1>

              {/* Supporting metadata — single quiet line */}
              <p className="mt-2 text-sm text-foreground-muted">
                {currentTime}
                {jobTitle && (
                  <>
                    {" · "}
                    <span className="text-foreground-secondary">{jobTitle}</span>
                  </>
                )}
                {department && (
                  <>
                    {" · "}
                    <span className="text-foreground-secondary">{department}</span>
                  </>
                )}
                <span> · {roleLabel}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Action Cards — 2x2 grid ── */}
        {/* Rationale: 2x2 even grid. Attendance is visually primary via accent border/fill
            because it's the most common daily action. Other three are neutral cards. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actions.map((action) => (
            <ActionCard key={action.href} {...action} />
          ))}
        </div>
      </main>
    </div>
  );
}
