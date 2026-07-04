import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleApiError } from "@/lib/rbac";

/**
 * GET /api/leave-requests/me
 * Employee views their own leave requests and statuses.
 */
export async function GET(request: NextRequest) {
  try {
    const user = withAuth(request);

    const requests = await prisma.leaveRequest.findMany({
      where: { employeeId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        leaveType: true,
        startDate: true,
        endDate: true,
        remarks: true,
        status: true,
        reviewerComment: true,
        createdAt: true,
        reviewer: {
          select: {
            id: true,
            profile: { select: { fullName: true } },
          },
        },
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    return handleApiError(error);
  }
}
