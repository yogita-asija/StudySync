import { prisma } from "@/lib/prisma";
import type { NotificationType, Prisma } from "@prisma/client";

export async function createNotification(
  userId: string,
  type: NotificationType,
  payload: Prisma.InputJsonValue
) {
  return prisma.notification.create({
    data: { userId, type, payload },
  });
}
