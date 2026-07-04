"use client";

import { useEffect, useState, useCallback } from "react";
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
  employeeId?: string;
  user?: { employeeId: string; profile: { fullName: string } | null };
}

export default function AttendancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      if (isAdmin) {
        const data = await apiFetch<{ records: AttendanceRecord[] }>("/api/attendance");
        setRecords(data.records);
      } else {
        const data = await apiFetch<{ records: AttendanceRecord[] }>("/api/attendance/me?range=weekly");
        setRecords(data.records);
        const today = new Date().toISOString().split("T")[0];
        const todayRec = data.records.find((r) => r.date.startsWith(today));
        setTodayRecord(todayRec || null);
      }
    } catch { /* handle silently */ } finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  async function handleCheckIn() {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await apiFetch<{ message: string; record: AttendanceRecord }>("/api/attendance/check-in", { method: "POST" });
      setTodayRecord(res.record);
      setMessage({ type: "success", text: res.message });
      fetchRecords();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Check-in failed" });
    } finally { setActionLoading(false); }
  }

  async function handleCheckOut() {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await apiFetch<{ message: string; record: AttendanceRecord }>("/api/attendance/check-out", { method: "POST" });
      setTodayRecord(res.record);
      setMessage({ type: "success", text: res.message });
      fetchRecords();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Check-out failed" });
    } finally { setActionLoading(false); }
  }

  const hasCheckedIn = !!todayRecord?.checkIn;
  const hasCheckedOut = !!todayRecord?.checkOut;

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="label-tactical mb-1">{isAdmin ? "System" : "Personal"}</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground-primary uppercase">
            {isAdmin ? "Attendance Overview" : "My Attendance"}
          </h1>
        </div>

        {!isAdmin && (
          <div className="card mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="label-tactical mb-1">Today</p>
                <p className="text-sm text-foreground-secondary font-mono">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
                {todayRecord && (
                  <div className="flex items-center gap-4 mt-2 text-xs text-foreground-muted font-mono">
                    <span>In: {todayRecord.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "---"}</span>
                    <span>Out: {todayRecord.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "---"}</span>
                    {todayRecord.status && <StatusBadge status={todayRecord.status} size="md" />}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={handleCheckIn} disabled={actionLoading || hasCheckedIn}
                  className="btn-primary disabled:opacity-30 disabled:cursor-not-allowed">
                  {actionLoading ? "..." : hasCheckedIn ? "Checked In" : "Check In"}
                </button>
                <button onClick={handleCheckOut} disabled={actionLoading || !hasCheckedIn || hasCheckedOut}
                  className="btn-danger disabled:opacity-30 disabled:cursor-not-allowed">
                  {actionLoading ? "..." : hasCheckedOut ? "Checked Out" : "Check Out"}
                </button>
              </div>
            </div>
            {message && (
              <div className={`mt-4 p-3 text-xs ${message.type === "success" ? "bg-success/10 border border-success/20 text-success" : "bg-danger/10 border border-danger/20 text-danger"}`}>
                {message.text}
              </div>
            )}
          </div>
        )}

        <div className="card">
          <h2 className="section-title mb-4">{isAdmin ? "All Employees" : "This Week"}</h2>
          {loading ? <LoadingSpinner /> : records.length === 0 ? (
            <p className="text-xs text-foreground-muted">No attendance records found.</p>
          ) : (
            <div className="space-y-1">
              {records.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between py-2.5 border-b border-surface-border last:border-0">
                  <div className="flex-1">
                    {isAdmin && rec.user && (
                      <p className="text-xs font-medium text-foreground-primary">{rec.user.profile?.fullName || rec.user.employeeId}</p>
                    )}
                    <p className="text-xs text-foreground-secondary font-mono">
                      {new Date(rec.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    <p className="text-[10px] text-foreground-muted font-mono mt-0.5">
                      {rec.checkIn ? `In: ${new Date(rec.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : "No check-in"}
                      {rec.checkOut ? ` > ${new Date(rec.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={rec.status} size="md" />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
