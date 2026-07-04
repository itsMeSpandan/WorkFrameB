import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleApiError } from "@/lib/rbac";

/**
 * GET /api/attendance/me?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&range=daily|weekly
 * Employee views their own attendance records.
 * Defaults to the last 7 days if no range is specified.
 */
export async function GET(request: NextRequest) {
  try {
    const user = withAuth(request);
    const { searchParams } = new URL(request.url);

    const range = searchParams.get("range") || "weekly";

    // Default date range: last 7 days for weekly, today for daily
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date();

    let startDate: Date;
    if (searchParams.get("startDate")) {
      startDate = new Date(searchParams.get("startDate")!);
    } else {
      startDate = new Date(endDate);
      if (range === "weekly") {
        startDate.setDate(startDate.getDate() - 6);
      }
    }

    // Normalize to start/end of day
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);

    const records = await prisma.attendanceRecord.findMany({
      where: {
        employeeId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        checkIn: true,
        checkOut: true,
        status: true,
      },
    });

    return NextResponse.json({ records, range });
  } catch (error) {
    return handleApiError(error);
  }
}
