import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin, handleApiError } from "@/lib/rbac";
import { adminProfileUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

interface RouteParams {
  params: { id: string };
}

/**
 * PATCH /api/employees/:id
 * Admin-only: edit any employee's full profile.
 * Every edit is written to AuditLog.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = withAdmin(request);
    const { id } = params;
    const body = await request.json();
    const parsed = adminProfileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, profile: { select: { id: true } } },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (!targetUser.profile) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
    }

    const updated = await prisma.employeeProfile.update({
      where: { userId: id },
      data: parsed.data,
      select: {
        fullName: true,
        phone: true,
        address: true,
        jobTitle: true,
        department: true,
        profilePictureUrl: true,
      },
    });

    // Audit log the admin action
    await logAudit(admin.id, "UPDATE_PROFILE", "EmployeeProfile", targetUser.profile.id);

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
