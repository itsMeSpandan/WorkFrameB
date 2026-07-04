import { prisma } from "./prisma";

/**
 * Logs an admin action to the AuditLog table.
 * Call this after every admin write action (profile edit, leave decision, etc.).
 *
 * @param actorId   The admin user who performed the action
 * @param action    Human-readable action description (e.g. "UPDATE_PROFILE")
 * @param targetEntity  The entity type affected (e.g. "EmployeeProfile")
 * @param targetId  The ID of the affected record
 */
export async function logAudit(
  actorId: string,
  action: string,
  targetEntity: string,
  targetId: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetEntity,
        targetId,
      },
    });
  } catch (error) {
    // Audit logging should never crash the main operation.
    // Log the failure but don't throw.
    console.error("Failed to write audit log:", error);
  }
}
