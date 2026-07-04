"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Employee {
  id: string;
  employeeId: string;
  email: string;
  emailVerified: boolean;
  profile: { fullName: string; department: string | null; jobTitle: string | null } | null;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const data = await apiFetch<{ users: Employee[] }>("/api/employees");
        setEmployees(data.users);
      } catch { /* handle silently */ } finally { setLoading(false); }
    }
    fetchEmployees();
  }, []);

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="label-tactical mb-1">Administration</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground-primary uppercase">
            Employees
          </h1>
        </div>

        {loading ? <LoadingSpinner /> : employees.length === 0 ? (
          <p className="text-xs text-foreground-muted">No employees found.</p>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-foreground-muted border-b border-surface-border bg-surface-base">
                    <th className="px-4 py-3 label-tactical">Name</th>
                    <th className="px-4 py-3 label-tactical">ID</th>
                    <th className="px-4 py-3 label-tactical">Email</th>
                    <th className="px-4 py-3 label-tactical">Dept</th>
                    <th className="px-4 py-3 label-tactical">Title</th>
                    <th className="px-4 py-3 label-tactical">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-surface-border last:border-0 hover:bg-surface-overlay">
                      <td className="px-4 py-3">
                        <Link href={`/employees/${emp.id}`} className="text-accent hover:text-accent-hover font-medium">
                          {emp.profile?.fullName || "---"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-foreground-muted font-mono">{emp.employeeId}</td>
                      <td className="px-4 py-3 text-foreground-secondary">{emp.email}</td>
                      <td className="px-4 py-3 text-foreground-secondary">{emp.profile?.department || "---"}</td>
                      <td className="px-4 py-3 text-foreground-secondary">{emp.profile?.jobTitle || "---"}</td>
                      <td className="px-4 py-3">
                        <span className={`label-tactical ${emp.emailVerified ? "text-success" : "text-warning"}`}>
                          {emp.emailVerified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
