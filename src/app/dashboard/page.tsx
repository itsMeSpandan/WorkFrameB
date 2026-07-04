"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  user?: { employeeId: string; profile: { fullName: string } | null };
}

// ─── Employee Dashboard ─────────────────────────────────────────────────────

function EmployeeDashboard() {
  const { user } = useAuth();
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [attRes, leaveRes] = await Promise.allSettled([
          apiFetch<{ records: AttendanceRecord[] }>("/api/attendance/me?range=weekly"),
          apiFetch<{ requests: LeaveRequest[] }>("/api/leave-requests/me"),
        ]);
        if (attRes.status === "fulfilled") setRecentAttendance(attRes.value.records.slice(0, 5));
        if (leaveRes.status === "fulfilled") setRecentLeaves(leaveRes.value.requests.slice(0, 5));
      } catch { /* best-effort */ } finally { setLoading(false); }
    }
    fetchData();
  }, []);

  const cards = [
    { href: "/profile", label: "Profile", desc: "View and edit your details", icon: "01" },
    { href: "/attendance", label: "Attendance", desc: "Check in/out, view history", icon: "02" },
    { href: "/leave", label: "Leave", desc: "Apply for leave, track status", icon: "03" },
  ];

  return (
    <>
      <div className="mb-8">
        <p className="label-tactical mb-1">Employee Portal</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground-primary uppercase">
          Welcome back, {user?.email?.split("@")[0] || "User"}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="card group hover:border-accent/40 transition-colors"
          >
            <span className="label-tactical text-accent">{card.icon}</span>
            <h3 className="font-heading text-sm font-semibold text-foreground-primary mt-2 uppercase tracking-tight">
              {card.label}
            </h3>
            <p className="text-xs text-foreground-muted mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h2 className="section-title mb-4">This Week</h2>
            {recentAttendance.length === 0 ? (
              <p className="text-xs text-foreground-muted">No attendance records this week.</p>
            ) : (
              <div className="space-y-2">
                {recentAttendance.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                    <span className="text-xs text-foreground-secondary font-mono">
                      {new Date(rec.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-foreground-muted font-mono">
                        {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "---"}
                        {rec.checkOut ? ` > ${new Date(rec.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : ""}
                      </span>
                      <StatusBadge status={rec.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="section-title mb-4">Leave Requests</h2>
            {recentLeaves.length === 0 ? (
              <p className="text-xs text-foreground-muted">No leave requests yet.</p>
            ) : (
              <div className="space-y-2">
                {recentLeaves.map((lr) => (
                  <div key={lr.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                    <div>
                      <span className="text-xs font-medium text-foreground-primary uppercase">{lr.leaveType}</span>
                      <span className="text-[10px] text-foreground-muted ml-2 font-mono">
                        {new Date(lr.startDate).toLocaleDateString()} - {new Date(lr.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <StatusBadge status={lr.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

function AdminDashboard() {
  const [employees, setEmployees] = useState<{ id: string; employeeId: string; email: string; profile: { fullName: string; department: string | null; jobTitle: string | null } | null }[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<{ employeeId: string; fullName: string; present: number; absent: number; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, leaveRes, attRes] = await Promise.allSettled([
          apiFetch<{ users: typeof employees }>("/api/employees"),
          apiFetch<{ requests: LeaveRequest[] }>("/api/leave-requests?status=PENDING"),
          apiFetch<{ records: { employeeId: string; status: string; user: { profile: { fullName: string } | null } }[] }>("/api/attendance"),
        ]);
        if (empRes.status === "fulfilled") setEmployees(empRes.value.users);
        if (leaveRes.status === "fulfilled") setPendingLeaves(leaveRes.value.requests);
        if (attRes.status === "fulfilled") {
          const summaryMap = new Map<string, { employeeId: string; fullName: string; present: number; absent: number; total: number }>();
          for (const rec of attRes.value.records) {
            const name = rec.user?.profile?.fullName || "Unknown";
            if (!summaryMap.has(rec.employeeId)) summaryMap.set(rec.employeeId, { employeeId: rec.employeeId, fullName: name, present: 0, absent: 0, total: 0 });
            const s = summaryMap.get(rec.employeeId)!;
            s.total++;
            if (rec.status === "PRESENT") s.present++;
            else if (rec.status === "ABSENT") s.absent++;
          }
          setAttendanceSummary(Array.from(summaryMap.values()).slice(0, 10));
        }
      } catch { /* best-effort */ } finally { setLoading(false); }
    }
    fetchData();
  }, []);

  return (
    <>
      <div className="mb-8">
        <p className="label-tactical mb-1">Admin Portal</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground-primary uppercase">
          Command Center
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="card">
          <span className="label-tactical">Total Employees</span>
          <p className="font-heading text-3xl font-bold text-foreground-primary mt-2">{employees.length}</p>
        </div>
        <div className="card">
          <span className="label-tactical">Pending Approvals</span>
          <p className="font-heading text-3xl font-bold text-accent mt-2">{pendingLeaves.length}</p>
        </div>
        <div className="card">
          <span className="label-tactical">Active This Week</span>
          <p className="font-heading text-3xl font-bold text-foreground-primary mt-2">{attendanceSummary.length}</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Pending Approvals</h2>
              <Link href="/leave" className="label-tactical text-accent hover:text-accent-hover">View all</Link>
            </div>
            {pendingLeaves.length === 0 ? (
              <p className="text-xs text-foreground-muted">No pending requests.</p>
            ) : (
              <div className="space-y-2">
                {pendingLeaves.slice(0, 5).map((lr) => (
                  <div key={lr.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                    <div>
                      <p className="text-xs font-medium text-foreground-primary">{lr.user?.profile?.fullName || lr.user?.employeeId}</p>
                      <p className="text-[10px] text-foreground-muted font-mono">{lr.leaveType} | {new Date(lr.startDate).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={lr.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Attendance</h2>
              <Link href="/attendance" className="label-tactical text-accent hover:text-accent-hover">View all</Link>
            </div>
            {attendanceSummary.length === 0 ? (
              <p className="text-xs text-foreground-muted">No attendance data.</p>
            ) : (
              <div className="space-y-2">
                {attendanceSummary.map((s) => (
                  <div key={s.employeeId} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                    <span className="text-xs text-foreground-secondary">{s.fullName}</span>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="text-success">{s.present}p</span>
                      <span className="text-danger">{s.absent}a</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card lg:col-span-2">
            <h2 className="section-title mb-4">Employees</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-foreground-muted border-b border-surface-border">
                    <th className="pb-2 font-medium label-tactical">Name</th>
                    <th className="pb-2 font-medium label-tactical">ID</th>
                    <th className="pb-2 font-medium label-tactical">Email</th>
                    <th className="pb-2 font-medium label-tactical">Dept</th>
                    <th className="pb-2 font-medium label-tactical">Title</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-surface-border last:border-0 hover:bg-surface-overlay">
                      <td className="py-2.5">
                        <Link href={`/employees/${emp.id}`} className="text-accent hover:text-accent-hover font-medium">
                          {emp.profile?.fullName || "---"}
                        </Link>
                      </td>
                      <td className="py-2.5 text-foreground-muted font-mono">{emp.employeeId}</td>
                      <td className="py-2.5 text-foreground-secondary">{emp.email}</td>
                      <td className="py-2.5 text-foreground-secondary">{emp.profile?.department || "---"}</td>
                      <td className="py-2.5 text-foreground-secondary">{emp.profile?.jobTitle || "---"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main (role-aware) ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <div className="min-h-screen bg-surface-base"><Navbar /><LoadingSpinner /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === "ADMIN" ? <AdminDashboard /> : <EmployeeDashboard />}
      </main>
    </div>
  );
}
