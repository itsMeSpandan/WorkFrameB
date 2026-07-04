"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  remarks: string | null;
  status: string;
  reviewerComment: string | null;
  createdAt: string;
  reviewer?: { id: string; profile: { fullName: string } | null } | null;
  user?: { employeeId: string; profile: { fullName: string } | null };
}

type Tab = "apply" | "history";

export default function LeavePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [tab, setTab] = useState<Tab>(isAdmin ? "history" : "apply");
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [leaveType, setLeaveType] = useState<"PAID" | "SICK" | "UNPAID">("PAID");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [decisionComment, setDecisionComment] = useState("");
  const [deciding, setDeciding] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const url = isAdmin ? "/api/leave-requests" : "/api/leave-requests/me";
      const data = await apiFetch<{ requests: LeaveRequest[] }>(url);
      setRequests(data.requests);
    } catch { /* handle silently */ } finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await apiFetch("/api/leave-requests", {
        method: "POST",
        body: { leaveType, startDate, endDate, remarks: remarks || undefined },
      });
      setMessage({ type: "success", text: "Leave request submitted." });
      setStartDate(""); setEndDate(""); setRemarks("");
      setTab("history");
      fetchRequests();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to submit" });
    } finally { setSubmitting(false); }
  }

  async function handleDecision(id: string, status: "APPROVED" | "REJECTED") {
    setDecisionId(id);
    setDeciding(true);
    setMessage(null);
    try {
      await apiFetch(`/api/leave-requests/${id}/decision`, {
        method: "PATCH",
        body: { status, reviewerComment: decisionComment || undefined },
      });
      setMessage({ type: "success", text: `Request ${status.toLowerCase()}.` });
      setDecisionId(null); setDecisionComment("");
      fetchRequests();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Decision failed" });
    } finally { setDeciding(false); }
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="label-tactical mb-1">{isAdmin ? "Approvals" : "Requests"}</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground-primary uppercase">
            {isAdmin ? "Leave Approvals" : "Leave Requests"}
          </h1>
        </div>

        <div className="flex border-b border-surface-border mb-6">
          {!isAdmin && (
            <button onClick={() => { setTab("apply"); setMessage(null); }}
              className={`px-4 py-2 text-xs font-medium uppercase tracking-tactical transition-colors ${tab === "apply" ? "border-b-2 border-accent text-accent" : "text-foreground-muted hover:text-foreground-secondary"}`}>
              Apply
            </button>
          )}
          <button onClick={() => { setTab("history"); setMessage(null); }}
            className={`px-4 py-2 text-xs font-medium uppercase tracking-tactical transition-colors ${tab === "history" ? "border-b-2 border-accent text-accent" : "text-foreground-muted hover:text-foreground-secondary"}`}>
            {isAdmin ? "All Requests" : "My Requests"}
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 text-xs ${message.type === "success" ? "bg-success/10 border border-success/20 text-success" : "bg-danger/10 border border-danger/20 text-danger"}`}>
            {message.text}
          </div>
        )}

        {tab === "apply" && (
          <form onSubmit={handleApply} className="card space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label-tactical block mb-1.5">Type</label>
                <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as "PAID" | "SICK" | "UNPAID")} className="input-field">
                  <option value="PAID">Paid</option>
                  <option value="SICK">Sick</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>
              <div>
                <label className="label-tactical block mb-1.5">Start</label>
                <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label-tactical block mb-1.5">End</label>
                <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
              </div>
            </div>
            <div>
              <label className="label-tactical block mb-1.5">Remarks</label>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} className="input-field" placeholder="Reason for leave..." />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        )}

        {tab === "history" && (
          <div className="card">
            {loading ? <LoadingSpinner /> : requests.length === 0 ? (
              <p className="text-xs text-foreground-muted">No leave requests found.</p>
            ) : (
              <div className="space-y-3">
                {requests.map((lr) => (
                  <div key={lr.id} className="border border-surface-border p-4">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground-primary uppercase">{lr.leaveType}</span>
                          <StatusBadge status={lr.status} size="md" />
                        </div>
                        {isAdmin && lr.user && (
                          <p className="text-xs text-foreground-secondary mt-1">{lr.user.profile?.fullName || lr.user.employeeId}</p>
                        )}
                        <p className="text-[10px] text-foreground-muted font-mono mt-1">
                          {new Date(lr.startDate).toLocaleDateString()} - {new Date(lr.endDate).toLocaleDateString()}
                        </p>
                        {lr.remarks && <p className="text-xs text-foreground-muted mt-1 italic">&ldquo;{lr.remarks}&rdquo;</p>}
                        {lr.reviewerComment && (
                          <p className="text-xs text-foreground-secondary mt-1"><span className="font-medium">Reviewer:</span> {lr.reviewerComment}</p>
                        )}
                      </div>

                      {isAdmin && lr.status === "PENDING" && (
                        <div className="flex flex-col gap-2">
                          {decisionId === lr.id ? (
                            <div className="flex flex-col gap-2">
                              <textarea value={decisionComment} onChange={(e) => setDecisionComment(e.target.value)} rows={2}
                                className="input-field text-xs" placeholder="Comment (optional)" />
                              <div className="flex gap-2">
                                <button onClick={() => handleDecision(lr.id, "APPROVED")} disabled={deciding}
                                  className="btn-primary text-[10px] py-1 px-3 disabled:opacity-50">Approve</button>
                                <button onClick={() => handleDecision(lr.id, "REJECTED")} disabled={deciding}
                                  className="btn-danger text-[10px] py-1 px-3 disabled:opacity-50">Reject</button>
                                <button onClick={() => { setDecisionId(null); setDecisionComment(""); }}
                                  className="btn-ghost text-[10px] py-1 px-3">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => { setDecisionId(lr.id); setDecisionComment(""); }}
                              className="label-tactical text-accent hover:text-accent-hover">Review</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
