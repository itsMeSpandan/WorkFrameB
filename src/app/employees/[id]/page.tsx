"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";

interface EmployeeDetail {
  id: string;
  employeeId: string;
  email: string;
  role: string;
  createdAt: string;
  profile: {
    fullName: string;
    phone: string | null;
    address: string | null;
    jobTitle: string | null;
    department: string | null;
    profilePictureUrl: string | null;
  } | null;
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");

  useEffect(() => {
    async function fetchEmployee() {
      try {
        const data = await apiFetch<{ users: { id: string; employeeId: string; email: string; role: string; createdAt: string; profile: EmployeeDetail["profile"] }[] }>("/api/employees");
        const emp = data.users.find((u) => u.id === id);
        if (emp) {
          setEmployee(emp as EmployeeDetail);
          setFullName(emp.profile?.fullName || "");
          setPhone(emp.profile?.phone || "");
          setAddress(emp.profile?.address || "");
          setJobTitle(emp.profile?.jobTitle || "");
          setDepartment(emp.profile?.department || "");
          setProfilePictureUrl(emp.profile?.profilePictureUrl || "");
        }
      } catch { /* handle silently */ } finally { setLoading(false); }
    }
    fetchEmployee();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(`/api/employees/${id}`, {
        method: "PATCH",
        body: { fullName: fullName || undefined, phone: phone || undefined, address: address || undefined, jobTitle: jobTitle || undefined, department: department || undefined, profilePictureUrl: profilePictureUrl || undefined },
      });
      setEmployee((prev) => prev ? { ...prev, profile: { ...prev.profile!, fullName, phone: phone || null, address: address || null, jobTitle: jobTitle || null, department: department || null, profilePictureUrl: profilePictureUrl || null } } : prev);
      setEditing(false);
      setMessage({ type: "success", text: "Employee profile updated." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" });
    } finally { setSaving(false); }
  }

  if (loading) return <div className="min-h-screen bg-surface-base"><Navbar /><LoadingSpinner /></div>;
  if (!employee) return <div className="min-h-screen bg-surface-base"><Navbar /><div className="max-w-3xl mx-auto p-8 text-center text-foreground-muted">Employee not found.</div></div>;

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="label-tactical mb-1">Employee Record</p>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground-primary uppercase">
              {employee.profile?.fullName || "No Name"}
            </h1>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-primary">Edit Profile</button>
          )}
        </div>

        {message && (
          <div className={`mb-4 p-3 text-xs ${message.type === "success" ? "bg-success/10 border border-success/20 text-success" : "bg-danger/10 border border-danger/20 text-danger"}`}>
            {message.text}
          </div>
        )}

        <div className="card space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-surface-overlay flex items-center justify-center font-heading text-xl font-bold text-accent overflow-hidden">
              {employee.profile?.profilePictureUrl ? (
                <img src={employee.profile.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (employee.profile?.fullName || employee.email)[0].toUpperCase()}
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground-primary">{employee.profile?.fullName || "No name set"}</h2>
              <p className="text-xs text-foreground-muted">{employee.profile?.jobTitle || "---"} | {employee.profile?.department || "---"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label-tactical block mb-1">Employee ID</label><p className="text-sm text-foreground-primary font-mono">{employee.employeeId}</p></div>
            <div><label className="label-tactical block mb-1">Email</label><p className="text-sm text-foreground-primary">{employee.email}</p></div>
            <div><label className="label-tactical block mb-1">Role</label><p className="text-sm text-foreground-primary uppercase">{employee.role}</p></div>
            <div><label className="label-tactical block mb-1">Member Since</label><p className="text-sm text-foreground-primary font-mono">{new Date(employee.createdAt).toLocaleDateString()}</p></div>
          </div>

          <div className="border-t border-surface-border pt-4">
            <h3 className="label-tactical mb-3">Profile Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Full Name", value: fullName, setter: setFullName },
                { label: "Phone", value: phone, setter: setPhone },
                { label: "Job Title", value: jobTitle, setter: setJobTitle },
                { label: "Department", value: department, setter: setDepartment },
              ].map((field) => (
                <div key={field.label}>
                  <label className="text-[10px] text-foreground-muted block mb-1">{field.label}</label>
                  {editing ? (
                    <input type="text" value={field.value} onChange={(e) => field.setter(e.target.value)} className="input-field" />
                  ) : (
                    <p className="text-sm text-foreground-primary">{field.value || "---"}</p>
                  )}
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="text-[10px] text-foreground-muted block mb-1">Address</label>
                {editing ? (
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="input-field" />
                ) : (
                  <p className="text-sm text-foreground-primary">{address || "---"}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] text-foreground-muted block mb-1">Profile Picture URL</label>
                {editing ? (
                  <input type="url" value={profilePictureUrl} onChange={(e) => setProfilePictureUrl(e.target.value)} className="input-field" />
                ) : (
                  <p className="text-sm text-foreground-primary truncate">{profilePictureUrl || "---"}</p>
                )}
              </div>
            </div>
          </div>

          {editing && (
            <div className="border-t border-surface-border pt-4 flex gap-3">
              <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
              <button onClick={() => { setEditing(false); setMessage(null); }} className="btn-ghost">Cancel</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
