import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleApiError } from "@/lib/rbac";

/**
 * POST /api/attendance/check-out
 * Records the current timestamp as checkOut for today.
 * Requires a check-in to exist first.
 */
export async function POST(request: NextRequest) {
  try {
    const user = withAuth(request);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        employeeId_date: {
          employeeId: user.id,
          date: today,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "No check-in record found for today. Please check in first." },
        { status: 400 }
      );
    }

    if (existing.checkOut) {
      return NextResponse.json(
        { error: "Already checked out today" },
        { status: 409 }
      );
    }

    if (!existing.checkIn) {
      return NextResponse.json(
        { error: "Cannot check out without checking in first" },
        { status: 400 }
      );
    }

    const now = new Date();
    const record = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkOut: now },
    });

    return NextResponse.json({
      message: "Checked out successfully",
      record: {
        id: record.id,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        status: record.status,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
