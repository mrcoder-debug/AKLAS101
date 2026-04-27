// DTO types returned by services. Services NEVER return raw Prisma rows —
// sensitive fields like passwordHash/tokenVersion must stay server-only.

import type {
  User as DBUser,
  Course as DBCourse,
  Lesson as DBLesson,
  Quiz as DBQuiz,
  Question as DBQuestion,
  Option as DBOption,
  Enrollment as DBEnrollment,
  QuizAttempt as DBAttempt,
  LessonProgress as DBProgress,
  Invitation as DBInvitation,
  AuditLog as DBAuditLog,
  Role,
  EnrollmentStatus,
  InvitationStatus,
  AuditAction,
} from "@prisma/client";

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export function toUserDTO(u: DBUser): UserDTO {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export interface CourseDTO {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructorId: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export function toCourseDTO(c: DBCourse): CourseDTO {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    instructorId: c.instructorId,
    isPublished: c.isPublished,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export interface LessonDTO {
  id: string;
  courseId: string;
  order: number;
  title: string;
  contentMd: string;
  videoUrl: string | null;
  simulatorKey: string | null;
  simulatorConfig: unknown;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export function toLessonDTO(l: DBLesson): LessonDTO {
  return {
    id: l.id,
    courseId: l.courseId,
    order: l.order,
    title: l.title,
    contentMd: l.contentMd,
    videoUrl: l.videoUrl,
    simulatorKey: l.simulatorKey,
    simulatorConfig: l.simulatorConfig,
    isPublished: l.isPublished,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
}

export interface OptionDTO { id: string; text: string }
// Author-side option includes isCorrect; student-side strips it.
export interface AuthorOptionDTO extends OptionDTO { isCorrect: boolean }
export interface QuestionDTO { id: string; order: number; text: string; options: OptionDTO[] }
export interface AuthorQuestionDTO {
  id: string;
  order: number;
  text: string;
  explanation: string | null;
  options: AuthorOptionDTO[];
}

export interface QuizDTO {
  id: string;
  lessonId: string;
  title: string;
  passingScore: number;
  questions: QuestionDTO[];
}
export interface AuthorQuizDTO {
  id: string;
  lessonId: string;
  title: string;
  passingScore: number;
  questions: AuthorQuestionDTO[];
}

type DBQuestionWithOptions = DBQuestion & { options: DBOption[] };
type DBQuizWithQuestions = DBQuiz & { questions: DBQuestionWithOptions[] };

export function toStudentQuizDTO(q: DBQuizWithQuestions): QuizDTO {
  return {
    id: q.id,
    lessonId: q.lessonId,
    title: q.title,
    passingScore: q.passingScore,
    questions: q.questions
      .sort((a, b) => a.order - b.order)
      .map((qu) => ({
        id: qu.id,
        order: qu.order,
        text: qu.text,
        options: qu.options.map((o) => ({ id: o.id, text: o.text })),
      })),
  };
}

export function toAuthorQuizDTO(q: DBQuizWithQuestions): AuthorQuizDTO {
  return {
    id: q.id,
    lessonId: q.lessonId,
    title: q.title,
    passingScore: q.passingScore,
    questions: q.questions
      .sort((a, b) => a.order - b.order)
      .map((qu) => ({
        id: qu.id,
        order: qu.order,
        text: qu.text,
        explanation: qu.explanation,
        options: qu.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
      })),
  };
}

export interface EnrollmentDTO {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
}
export function toEnrollmentDTO(e: DBEnrollment): EnrollmentDTO {
  return {
    id: e.id,
    userId: e.userId,
    courseId: e.courseId,
    status: e.status,
    enrolledAt: e.enrolledAt,
  };
}

export interface AttemptDTO {
  id: string;
  userId: string;
  quizId: string;
  startedAt: Date;
  submittedAt: Date | null;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
}
export function toAttemptDTO(a: DBAttempt): AttemptDTO {
  return {
    id: a.id,
    userId: a.userId,
    quizId: a.quizId,
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
    score: a.score,
    passed: a.passed,
    answers: (a.answers as Record<string, string>) ?? {},
  };
}

export interface ProgressDTO {
  lessonId: string;
  completedAt: Date;
}
export function toProgressDTO(p: DBProgress): ProgressDTO {
  return { lessonId: p.lessonId, completedAt: p.completedAt };
}

export interface InvitationDTO {
  id: string;
  email: string;
  role: Role;
  status: InvitationStatus;
  expiresAt: Date;
  invitedById: string;
  invitedByName: string;
  acceptedAt: Date | null;
  createdAt: Date;
}
export function toInvitationDTO(
  inv: DBInvitation & { invitedBy: { name: string } },
): InvitationDTO {
  return {
    id: inv.id,
    email: inv.email,
    role: inv.role,
    status: inv.status,
    expiresAt: inv.expiresAt,
    invitedById: inv.invitedById,
    invitedByName: inv.invitedBy.name,
    acceptedAt: inv.acceptedAt,
    createdAt: inv.createdAt,
  };
}

export interface AuditLogDTO {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  meta: unknown;
  createdAt: Date;
}
export function toAuditLogDTO(
  log: DBAuditLog & { actor: { name: string; email: string } },
): AuditLogDTO {
  return {
    id: log.id,
    actorId: log.actorId,
    actorName: log.actor.name,
    actorEmail: log.actor.email,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    meta: log.meta,
    createdAt: log.createdAt,
  };
}

// ── AI DTOs ──────────────────────────────────────────────────────────────────

export interface AIMessageDTO {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface FlashcardDTO {
  id: string;
  front: string;
  back: string;
  order: number;
}

export interface LessonSummaryDTO {
  id: string;
  lessonId: string;
  content: string;
  model: string;
  generatedAt: Date;
}

// ── Forum DTOs ───────────────────────────────────────────────────────────────

export interface ForumThreadDTO {
  id: string;
  courseId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  replyCount: number;
  voteScore: number;
  myVote: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumReplyDTO {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  parentId: string | null;
  content: string;
  isAccepted: boolean;
  voteScore: number;
  myVote: number | null;
  children: ForumReplyDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumThreadDetailDTO extends ForumThreadDTO {
  replies: ForumReplyDTO[];
}

export interface UserProfileDTO extends UserDTO {
  avatarUrl: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  githubUrl: string | null;
  theme: string;
}
export function toUserProfileDTO(u: DBUser): UserProfileDTO {
  return {
    ...toUserDTO(u),
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    linkedinUrl: u.linkedinUrl,
    twitterUrl: u.twitterUrl,
    githubUrl: u.githubUrl,
    theme: u.theme,
  };
}
