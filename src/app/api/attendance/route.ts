import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin, handleApiError } from "@/lib/rbac";

/**
 * GET /api/attendance?employeeId=xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Admin-only: view attendance for a specific employee or all employees.
 */
export async function GET(request: NextRequest) {
  try {
    withAdmin(request);
    const { searchParams } = new URL(request.url);

    const employeeId = searchParams.get("employeeId");

    // Default: last 7 days
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date();

    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : new Date(endDate);
    if (!searchParams.get("startDate")) {
      startDate.setDate(startDate.getDate() - 6);
    }

    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      date: { gte: startDate, lte: endDate },
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: [{ date: "desc" }, { employeeId: "asc" }],
      select: {
        id: true,
        employeeId: true,
        date: true,
        checkIn: true,
        checkOut: true,
        status: true,
        user: {
          select: {
            employeeId: true,
            profile: { select: { fullName: true } },
          },
        },
      },
    });

    return NextResponse.json({ records });
  } catch (error) {
    return handleApiError(error);
  }
}
