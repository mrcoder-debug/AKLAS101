import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { assertCan } from "./authorization";
import type { ServiceContext } from "./context";
import { requireActor } from "./context";
import { ForbiddenError, NotFoundError } from "./errors";
import { parse } from "./_util";
import type { ForumThreadDTO, ForumReplyDTO, ForumThreadDetailDTO } from "./dto";
import { awardXP } from "./gamification.service";

// ── Input schemas ─────────────────────────────────────────────────────────────

const createThreadSchema = z.object({
  courseId: z.string().cuid(),
  title: z.string().trim().min(3).max(200),
  content: z.string().trim().min(10).max(10000),
});

const createReplySchema = z.object({
  threadId: z.string().cuid(),
  content: z.string().trim().min(1).max(10000),
  parentId: z.string().cuid().optional(),
});

const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)]),
});

// ── DTO builders ──────────────────────────────────────────────────────────────

type DBThread = {
  id: string;
  courseId: string;
  authorId: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: { name: string };
  replies: { id: string }[];
  votes: { userId: string; value: number }[];
};

function toThreadDTO(t: DBThread, actorId: string): ForumThreadDTO {
  const score = t.votes.reduce((s, v) => s + v.value, 0);
  const myVote = t.votes.find((v) => v.userId === actorId)?.value ?? null;
  return {
    id: t.id,
    courseId: t.courseId,
    authorId: t.authorId,
    authorName: t.author.name,
    title: t.title,
    content: t.content,
    isPinned: t.isPinned,
    isLocked: t.isLocked,
    replyCount: t.replies.length,
    voteScore: score,
    myVote,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

type FlatReply = {
  id: string;
  threadId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  isAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: { name: string };
  votes: { userId: string; value: number }[];
};

function buildReplyTree(flat: FlatReply[], actorId: string): ForumReplyDTO[] {
  const map = new Map<string, ForumReplyDTO>();
  const roots: ForumReplyDTO[] = [];

  // Sort: accepted first, then by createdAt asc
  const sorted = [...flat].sort((a, b) => {
    if (a.isAccepted !== b.isAccepted) return a.isAccepted ? -1 : 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  for (const r of sorted) {
    const score = r.votes.reduce((s, v) => s + v.value, 0);
    const myVote = r.votes.find((v) => v.userId === actorId)?.value ?? null;
    const dto: ForumReplyDTO = {
      id: r.id,
      threadId: r.threadId,
      authorId: r.authorId,
      authorName: r.author.name,
      parentId: r.parentId,
      content: r.content,
      isAccepted: r.isAccepted,
      voteScore: score,
      myVote,
      children: [],
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
    map.set(r.id, dto);
  }

  for (const dto of map.values()) {
    if (dto.parentId) {
      map.get(dto.parentId)?.children.push(dto);
    } else {
      roots.push(dto);
    }
  }

  return roots;
}

const replyInclude = {
  author: { select: { name: true } },
  votes: { select: { userId: true, value: true } },
} as const;

// ── Common helpers ────────────────────────────────────────────────────────────

async function getCourseAndEnrollment(courseId: string, userId: string) {
  const [course, enrollment] = await Promise.all([
    prisma.course.findFirst({ where: { id: courseId, deletedAt: null } }),
    prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    }),
  ]);
  if (!course) throw new NotFoundError("Course");
  return { course, enrollment };
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function listThreads(
  ctx: ServiceContext,
  courseId: string,
): Promise<ForumThreadDTO[]> {
  const actor = requireActor(ctx);
  const { course, enrollment } = await getCourseAndEnrollment(courseId, actor.id);

  assertCan(actor, {
    action: "forum:post",
    resource: {
      course: { id: course.id, instructorId: course.instructorId },
      enrollment: enrollment
        ? { id: enrollment.id, userId: enrollment.userId, courseId: enrollment.courseId, status: enrollment.status }
        : null,
    },
  });

  const threads = await prisma.forumThread.findMany({
    where: { courseId, deletedAt: null },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    include: {
      author: { select: { name: true } },
      replies: { where: { deletedAt: null }, select: { id: true } },
      votes: { select: { userId: true, value: true } },
    },
  });

  return threads.map((t) => toThreadDTO(t, actor.id));
}

export async function createThread(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<ForumThreadDTO> {
  const actor = requireActor(ctx);
  const input = parse(createThreadSchema, rawInput);
  const { course, enrollment } = await getCourseAndEnrollment(input.courseId, actor.id);

  assertCan(actor, {
    action: "forum:post",
    resource: {
      course: { id: course.id, instructorId: course.instructorId },
      enrollment: enrollment
        ? { id: enrollment.id, userId: enrollment.userId, courseId: enrollment.courseId, status: enrollment.status }
        : null,
    },
  });

  const thread = await prisma.$transaction(async (tx) => {
    const t = await tx.forumThread.create({
      data: {
        courseId: input.courseId,
        authorId: actor.id,
        title: input.title,
        content: input.content,
      },
      include: {
        author: { select: { name: true } },
        replies: { select: { id: true } },
        votes: { select: { userId: true, value: true } },
      },
    });
    await awardXP(tx, actor.id, 5);
    return t;
  });

  return toThreadDTO(thread, actor.id);
}

export async function getThread(
  ctx: ServiceContext,
  threadId: string,
): Promise<ForumThreadDetailDTO> {
  const actor = requireActor(ctx);

  const thread = await prisma.forumThread.findFirst({
    where: { id: threadId, deletedAt: null },
    include: {
      author: { select: { name: true } },
      replies: { where: { deletedAt: null }, select: { id: true } },
      votes: { select: { userId: true, value: true } },
    },
  });
  if (!thread) throw new NotFoundError("Thread");

  const { course, enrollment } = await getCourseAndEnrollment(thread.courseId, actor.id);
  assertCan(actor, {
    action: "forum:post",
    resource: {
      course: { id: course.id, instructorId: course.instructorId },
      enrollment: enrollment
        ? { id: enrollment.id, userId: enrollment.userId, courseId: enrollment.courseId, status: enrollment.status }
        : null,
    },
  });

  // Fetch all non-deleted replies flat, build tree in memory.
  const flatReplies = await prisma.forumReply.findMany({
    where: { threadId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: replyInclude,
  });

  return {
    ...toThreadDTO(thread, actor.id),
    replies: buildReplyTree(flatReplies, actor.id),
  };
}

export async function createReply(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<ForumReplyDTO> {
  const actor = requireActor(ctx);
  const input = parse(createReplySchema, rawInput);

  const thread = await prisma.forumThread.findFirst({
    where: { id: input.threadId, deletedAt: null },
  });
  if (!thread) throw new NotFoundError("Thread");
  if (thread.isLocked) throw new ForbiddenError("Thread is locked");

  const { course, enrollment } = await getCourseAndEnrollment(thread.courseId, actor.id);
  assertCan(actor, {
    action: "forum:post",
    resource: {
      course: { id: course.id, instructorId: course.instructorId },
      enrollment: enrollment
        ? { id: enrollment.id, userId: enrollment.userId, courseId: enrollment.courseId, status: enrollment.status }
        : null,
    },
  });

  if (input.parentId) {
    const parent = await prisma.forumReply.findFirst({
      where: { id: input.parentId, threadId: input.threadId, deletedAt: null },
    });
    if (!parent) throw new NotFoundError("Parent reply");
    if (parent.parentId) throw new ForbiddenError("Cannot nest replies more than 1 level deep");
  }

  const reply = await prisma.$transaction(async (tx) => {
    const r = await tx.forumReply.create({
      data: {
        threadId: input.threadId,
        authorId: actor.id,
        content: input.content,
        parentId: input.parentId ?? null,
      },
      include: replyInclude,
    });
    await awardXP(tx, actor.id, 3);
    return r;
  });

  return {
    id: reply.id,
    threadId: reply.threadId,
    authorId: reply.authorId,
    authorName: reply.author.name,
    parentId: reply.parentId,
    content: reply.content,
    isAccepted: reply.isAccepted,
    voteScore: 0,
    myVote: null,
    children: [],
    createdAt: reply.createdAt,
    updatedAt: reply.updatedAt,
  };
}

export async function voteThread(
  ctx: ServiceContext,
  threadId: string,
  rawInput: unknown,
): Promise<{ voteScore: number; myVote: number | null }> {
  const actor = requireActor(ctx);
  const { value } = parse(voteSchema, rawInput);

  const thread = await prisma.forumThread.findFirst({
    where: { id: threadId, deletedAt: null },
  });
  if (!thread) throw new NotFoundError("Thread");

  const { course, enrollment } = await getCourseAndEnrollment(thread.courseId, actor.id);
  assertCan(actor, {
    action: "forum:post",
    resource: {
      course: { id: course.id, instructorId: course.instructorId },
      enrollment: enrollment
        ? { id: enrollment.id, userId: enrollment.userId, courseId: enrollment.courseId, status: enrollment.status }
        : null,
    },
  });

  const existing = await prisma.forumVote.findUnique({
    where: { userId_threadId: { userId: actor.id, threadId } },
  });

  if (existing) {
    if (existing.value === value) {
      await prisma.forumVote.delete({ where: { userId_threadId: { userId: actor.id, threadId } } });
    } else {
      await prisma.forumVote.update({
        where: { userId_threadId: { userId: actor.id, threadId } },
        data: { value },
      });
    }
  } else {
    await prisma.forumVote.create({ data: { userId: actor.id, threadId, value } });
  }

  const votes = await prisma.forumVote.findMany({ where: { threadId } });
  const voteScore = votes.reduce((s, v) => s + v.value, 0);
  const myVoteRow = votes.find((v) => v.userId === actor.id);
  return { voteScore, myVote: myVoteRow?.value ?? null };
}

export async function voteReply(
  ctx: ServiceContext,
  replyId: string,
  rawInput: unknown,
): Promise<{ voteScore: number; myVote: number | null }> {
  const actor = requireActor(ctx);
  const { value } = parse(voteSchema, rawInput);

  const reply = await prisma.forumReply.findFirst({
    where: { id: replyId, deletedAt: null },
    include: { thread: { select: { courseId: true } } },
  });
  if (!reply) throw new NotFoundError("Reply");

  const { course, enrollment } = await getCourseAndEnrollment(reply.thread.courseId, actor.id);
  assertCan(actor, {
    action: "forum:post",
    resource: {
      course: { id: course.id, instructorId: course.instructorId },
      enrollment: enrollment
        ? { id: enrollment.id, userId: enrollment.userId, courseId: enrollment.courseId, status: enrollment.status }
        : null,
    },
  });

  const existing = await prisma.forumVote.findUnique({
    where: { userId_replyId: { userId: actor.id, replyId } },
  });

  if (existing) {
    if (existing.value === value) {
      await prisma.forumVote.delete({ where: { userId_replyId: { userId: actor.id, replyId } } });
    } else {
      await prisma.forumVote.update({
        where: { userId_replyId: { userId: actor.id, replyId } },
        data: { value },
      });
    }
  } else {
    await prisma.forumVote.create({ data: { userId: actor.id, replyId, value } });
  }

  const votes = await prisma.forumVote.findMany({ where: { replyId } });
  const voteScore = votes.reduce((s, v) => s + v.value, 0);
  const myVoteRow = votes.find((v) => v.userId === actor.id);
  return { voteScore, myVote: myVoteRow?.value ?? null };
}

export async function markAccepted(
  ctx: ServiceContext,
  replyId: string,
): Promise<void> {
  const actor = requireActor(ctx);

  const reply = await prisma.forumReply.findFirst({
    where: { id: replyId, deletedAt: null },
    include: { thread: { select: { courseId: true, authorId: true } } },
  });
  if (!reply) throw new NotFoundError("Reply");

  const course = await prisma.course.findFirst({
    where: { id: reply.thread.courseId, deletedAt: null },
  });
  if (!course) throw new NotFoundError("Course");

  assertCan(actor, {
    action: "forum:moderate",
    resource: { id: course.id, instructorId: course.instructorId },
  });

  await prisma.$transaction([
    prisma.forumReply.updateMany({
      where: { threadId: reply.threadId },
      data: { isAccepted: false },
    }),
    prisma.forumReply.update({
      where: { id: replyId },
      data: { isAccepted: true },
    }),
  ]);
}

export async function deleteThread(
  ctx: ServiceContext,
  threadId: string,
): Promise<void> {
  const actor = requireActor(ctx);

  const thread = await prisma.forumThread.findFirst({
    where: { id: threadId, deletedAt: null },
  });
  if (!thread) throw new NotFoundError("Thread");

  const course = await prisma.course.findFirst({
    where: { id: thread.courseId, deletedAt: null },
  });
  if (!course) throw new NotFoundError("Course");

  const canModerate = actor.role === "ADMIN" ||
    (actor.role === "INSTRUCTOR" && course.instructorId === actor.id);
  const isAuthor = thread.authorId === actor.id;

  if (!canModerate && !isAuthor) throw new ForbiddenError();

  await prisma.forumThread.update({
    where: { id: threadId },
    data: { deletedAt: new Date() },
  });
}

export async function deleteReply(
  ctx: ServiceContext,
  replyId: string,
): Promise<void> {
  const actor = requireActor(ctx);

  const reply = await prisma.forumReply.findFirst({
    where: { id: replyId, deletedAt: null },
    include: { thread: { select: { courseId: true } } },
  });
  if (!reply) throw new NotFoundError("Reply");

  const course = await prisma.course.findFirst({
    where: { id: reply.thread.courseId, deletedAt: null },
  });
  if (!course) throw new NotFoundError("Course");

  const canModerate = actor.role === "ADMIN" ||
    (actor.role === "INSTRUCTOR" && course.instructorId === actor.id);
  const isAuthor = reply.authorId === actor.id;

  if (!canModerate && !isAuthor) throw new ForbiddenError();

  await prisma.forumReply.update({
    where: { id: replyId },
    data: { deletedAt: new Date() },
  });
}

export async function pinThread(
  ctx: ServiceContext,
  threadId: string,
  pinned: boolean,
): Promise<void> {
  const actor = requireActor(ctx);

  const thread = await prisma.forumThread.findFirst({
    where: { id: threadId, deletedAt: null },
  });
  if (!thread) throw new NotFoundError("Thread");

  const course = await prisma.course.findFirst({
    where: { id: thread.courseId, deletedAt: null },
  });
  if (!course) throw new NotFoundError("Course");

  assertCan(actor, {
    action: "forum:moderate",
    resource: { id: course.id, instructorId: course.instructorId },
  });

  await prisma.forumThread.update({ where: { id: threadId }, data: { isPinned: pinned } });
}
