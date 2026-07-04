"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";

interface ProfileData {
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
  documents: { id: string; fileUrl: string; type: string; uploadedAt: string }[];
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await apiFetch<ProfileData>("/api/me/profile");
        setProfile(data);
        setPhone(data.profile?.phone || "");
        setAddress(data.profile?.address || "");
        setProfilePictureUrl(data.profile?.profilePictureUrl || "");
      } catch { /* handle silently */ } finally { setLoading(false); }
    }
    fetchProfile();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiFetch<{ fullName: string; phone: string | null; address: string | null; jobTitle: string | null; department: string | null; profilePictureUrl: string | null }>("/api/me/profile", {
        method: "PATCH",
        body: { phone, address, profilePictureUrl: profilePictureUrl || undefined },
      });
      setProfile((prev) => (prev ? { ...prev, profile: { ...prev.profile!, ...updated } } : prev));
      setEditing(false);
      setMessage({ type: "success", text: "Profile updated." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" });
    } finally { setSaving(false); }
  }

  if (loading) return <div className="min-h-screen bg-surface-base"><Navbar /><LoadingSpinner /></div>;
  if (!profile) return <div className="min-h-screen bg-surface-base"><Navbar /><div className="max-w-3xl mx-auto p-8 text-center text-foreground-muted">Profile not found.</div></div>;

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="label-tactical mb-1">Profile</p>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground-primary uppercase">
              {profile.profile?.fullName || "No Name"}
            </h1>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-primary">
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div className={`mb-4 p-3 text-sm ${message.type === "success" ? "bg-success/10 border border-success/20 text-success" : "bg-danger/10 border border-danger/20 text-danger"}`}>
            {message.text}
          </div>
        )}

        <div className="card space-y-6">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-surface-overlay flex items-center justify-center font-heading text-xl font-bold text-accent overflow-hidden">
              {profile.profile?.profilePictureUrl ? (
                <img src={profile.profile.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (profile.profile?.fullName || profile.email)[0].toUpperCase()
              )}
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground-primary">{profile.profile?.fullName || "No name set"}</h2>
              <p className="text-xs text-foreground-muted">{profile.profile?.jobTitle || "---"} | {profile.profile?.department || "---"}</p>
            </div>
          </div>

          {/* Read-only fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-tactical block mb-1">Employee ID</label>
              <p className="text-sm text-foreground-primary font-mono">{profile.employeeId}</p>
            </div>
            <div>
              <label className="label-tactical block mb-1">Email</label>
              <p className="text-sm text-foreground-primary">{profile.email}</p>
            </div>
            <div>
              <label className="label-tactical block mb-1">Role</label>
              <p className="text-sm text-foreground-primary uppercase">{profile.role}</p>
            </div>
            <div>
              <label className="label-tactical block mb-1">Member Since</label>
              <p className="text-sm text-foreground-primary font-mono">{new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Editable fields */}
          <div className="border-t border-surface-border pt-4">
            <h3 className="label-tactical mb-3">Contact Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-foreground-muted block mb-1">Phone</label>
                {editing ? (
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="+1 234 567 890" />
                ) : (
                  <p className="text-sm text-foreground-primary">{profile.profile?.phone || "---"}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] text-foreground-muted block mb-1">Address</label>
                {editing ? (
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="input-field" placeholder="Your address" />
                ) : (
                  <p className="text-sm text-foreground-primary">{profile.profile?.address || "---"}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] text-foreground-muted block mb-1">Profile Picture URL</label>
                {editing ? (
                  <input type="url" value={profilePictureUrl} onChange={(e) => setProfilePictureUrl(e.target.value)} className="input-field" placeholder="https://example.com/photo.jpg" />
                ) : (
                  <p className="text-sm text-foreground-primary truncate">{profile.profile?.profilePictureUrl || "---"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Documents */}
          {profile.documents.length > 0 && (
            <div className="border-t border-surface-border pt-4">
              <h3 className="label-tactical mb-3">Documents</h3>
              <div className="space-y-2">
                {profile.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                    <div>
                      <p className="text-xs font-medium text-foreground-primary uppercase">{doc.type}</p>
                      <p className="text-[10px] text-foreground-muted font-mono">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    </div>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="label-tactical text-accent hover:text-accent-hover">View</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editing && (
            <div className="border-t border-surface-border pt-4 flex gap-3">
              <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setPhone(profile.profile?.phone || "");
                  setAddress(profile.profile?.address || "");
                  setProfilePictureUrl(profile.profile?.profilePictureUrl || "");
                  setMessage(null);
                }}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
