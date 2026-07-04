import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin, handleApiError } from "@/lib/rbac";

/**
 * GET /api/employees
 * Admin-only: list all employees with their profiles.
 */
export async function GET(request: NextRequest) {
  try {
    withAdmin(request);

    const users = await prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        employeeId: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        profile: {
          select: {
            fullName: true,
            phone: true,
            address: true,
            jobTitle: true,
            department: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}
