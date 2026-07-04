import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin, handleApiError } from "@/lib/rbac";
import { leaveDecisionSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

interface RouteParams {
  params: { id: string };
}

/**
 * PATCH /api/leave-requests/:id/decision
 * Admin approves or rejects a leave request with an optional comment.
 * Writes an AuditLog entry for the action.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = withAdmin(request);
    const { id } = params;
    const body = await request.json();
    const parsed = leaveDecisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, reviewerComment } = parsed.data;

    // Verify the leave request exists and is still pending
    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
      select: { id: true, status: true, employeeId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: `Leave request has already been ${existing.status.toLowerCase()}` },
        { status: 409 }
      );
    }

    // Update the leave request
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewerComment: reviewerComment || null,
        reviewedBy: admin.id,
      },
      select: {
        id: true,
        leaveType: true,
        startDate: true,
        endDate: true,
        remarks: true,
        status: true,
        reviewerComment: true,
        reviewedBy: true,
        createdAt: true,
      },
    });

    // Audit log the decision
    await logAudit(
      admin.id,
      `LEAVE_${status}`,
      "LeaveRequest",
      id
    );

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
