"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Level } from "@prisma/client";

export async function completeOnboarding(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const timezone = formData.get("timezone") as string;
  const subjectNames = formData.getAll("subjects") as string[];
  const level = formData.get("level") as Level;

  if (!timezone || subjectNames.length === 0) {
    throw new Error("Please select a timezone and at least one subject");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { timezone },
  });

  for (const name of subjectNames) {
    const subject = await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    await prisma.userSubject.upsert({
      where: {
        userId_subjectId: {
          userId: session.user.id,
          subjectId: subject.id,
        },
      },
      update: { level },
      create: {
        userId: session.user.id,
        subjectId: subject.id,
        level,
      },
    });
  }

  redirect("/dashboard");
}
