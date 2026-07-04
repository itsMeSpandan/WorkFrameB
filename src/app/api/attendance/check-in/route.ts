import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleApiError } from "@/lib/rbac";

/**
 * POST /api/attendance/check-in
 * Records the current timestamp as checkIn for today.
 * Creates a new AttendanceRecord if none exists for today.
 */
export async function POST(request: NextRequest) {
  try {
    const user = withAuth(request);

    // Use today's date (UTC) as the date key
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check if a record already exists for today
    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        employeeId_date: {
          employeeId: user.id,
          date: today,
        },
      },
    });

    if (existing && existing.checkIn) {
      return NextResponse.json(
        { error: "Already checked in today" },
        { status: 409 }
      );
    }

    const now = new Date();

    let record;
    if (existing) {
      // Update existing record (was created as ABSENT or LEAVE, now checking in)
      record = await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          checkIn: now,
          status: "PRESENT",
        },
      });
    } else {
      // Create new record
      record = await prisma.attendanceRecord.create({
        data: {
          employeeId: user.id,
          date: today,
          checkIn: now,
          status: "PRESENT",
        },
      });
    }

    return NextResponse.json({
      message: "Checked in successfully",
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
