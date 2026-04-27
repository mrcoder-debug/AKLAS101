import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ServiceContext } from "./context";
import { requireActor } from "./context";

export interface CertificateDTO {
  id: string;
  shareToken: string;
  issuedAt: Date;
  course: {
    id: string;
    title: string;
    description: string;
  };
}

export interface CertificatePublicDTO {
  studentName: string;
  courseName: string;
  issuedAt: Date;
}

export async function awardCertificate(
  tx: Prisma.TransactionClient,
  userId: string,
  courseId: string,
): Promise<void> {
  await tx.certificate.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });
}

export async function listCertificates(ctx: ServiceContext): Promise<CertificateDTO[]> {
  const actor = requireActor(ctx);
  const rows = await prisma.certificate.findMany({
    where: { userId: actor.id },
    include: {
      course: { select: { id: true, title: true, description: true } },
    },
    orderBy: { issuedAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    shareToken: r.shareToken,
    issuedAt: r.issuedAt,
    course: {
      id: r.course.id,
      title: r.course.title,
      description: r.course.description ?? "",
    },
  }));
}

export async function getCertificateByShareToken(
  shareToken: string,
): Promise<CertificatePublicDTO | null> {
  const cert = await prisma.certificate.findUnique({
    where: { shareToken },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true } },
    },
  });
  if (!cert) return null;
  return {
    studentName: cert.user.name,
    courseName: cert.course.title,
    issuedAt: cert.issuedAt,
  };
}
