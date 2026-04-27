// Authorization is enforced in the service layer. Route guards and layout
// guards are UI-level safety nets; this file is the authoritative rule set.
//
// Every service action that mutates or reads sensitive data MUST call
// `assertCan(...)` with the actor and a resource (if the action is scoped).

import { ForbiddenError, UnauthorizedError } from "./errors";

export type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT";

export interface Actor {
  id: string;
  role: Role;
  isActive: boolean;
}

// Resources are the minimal shapes needed to make a decision. Services fetch
// these directly before calling `can`.
interface CourseRef { id: string; instructorId: string }
interface LessonRef { id: string; courseId: string; isPublished: boolean }
interface EnrollmentRef { id: string; userId: string; courseId: string; status: "ACTIVE" | "REVOKED" }
interface AttemptRef { id: string; userId: string; submittedAt: Date | null }
interface UserRef { id: string }
interface InvitationRef { id: string; invitedById: string }
interface ForumAuthorRef { authorId: string }

export type PermissionArgs =
  | { action: "user:create" }
  | { action: "user:list" }
  | { action: "user:update"; resource: UserRef }
  | { action: "user:deactivate"; resource: UserRef }
  | { action: "user:delete"; resource: UserRef }
  | { action: "user:changeRole"; resource: UserRef }
  | { action: "course:create" }
  | { action: "course:list" }
  | { action: "course:read"; resource: CourseRef; enrollment?: EnrollmentRef | null }
  | { action: "course:update"; resource: CourseRef }
  | { action: "course:publish"; resource: CourseRef }
  | { action: "course:delete"; resource: CourseRef }
  | { action: "lesson:create"; resource: CourseRef }
  | { action: "lesson:update"; resource: { course: CourseRef } }
  | { action: "lesson:delete"; resource: { course: CourseRef } }
  | { action: "lesson:view"; resource: { course: CourseRef; lesson: LessonRef; enrollment?: EnrollmentRef | null } }
  | { action: "lesson:markComplete"; resource: { course: CourseRef; lesson: LessonRef; enrollment?: EnrollmentRef | null } }
  | { action: "enrollment:manage"; resource: CourseRef }
  | { action: "enrollment:list" }
  | { action: "quiz:manage"; resource: { course: CourseRef } }
  | { action: "quiz:view"; resource: { course: CourseRef; enrollment?: EnrollmentRef | null } }
  | { action: "quiz:startAttempt"; resource: { course: CourseRef; enrollment?: EnrollmentRef | null } }
  | { action: "quiz:submitAttempt"; resource: AttemptRef }
  | { action: "quiz:viewAttempt"; resource: { attempt: AttemptRef; course: CourseRef } }
  // ── Invitations (ADMIN only) ──
  | { action: "invitation:create" }
  | { action: "invitation:list" }
  | { action: "invitation:revoke"; resource: InvitationRef }
  | { action: "invitation:resend"; resource: InvitationRef }
  // ── Audit log ──
  | { action: "auditLog:list" }
  // ── Profile (own account) ──
  | { action: "profile:update"; resource: UserRef }
  // ── AI ──
  | { action: "ai:chat"; resource: { course: CourseRef; enrollment?: EnrollmentRef | null } }
  | { action: "ai:generateContent"; resource: CourseRef }
  // ── Forums ──
  | { action: "forum:post"; resource: { course: CourseRef; enrollment?: EnrollmentRef | null } }
  | { action: "forum:moderate"; resource: CourseRef }
  | { action: "forum:deleteOwn"; resource: ForumAuthorRef };

export function can(actor: Actor | null, args: PermissionArgs): boolean {
  if (!actor || !actor.isActive) return false;
  const role = actor.role;

  switch (args.action) {
    // --- Users: admin-only surface ---
    case "user:create":
    case "user:list":
    case "user:update":
    case "user:deactivate":
    case "user:delete":
    case "user:changeRole":
      return role === "ADMIN";

    // --- Courses ---
    case "course:create":
      return role === "ADMIN" || role === "INSTRUCTOR";
    case "course:list":
      // All authenticated users can list (service scopes the query).
      return true;
    case "course:read": {
      if (role === "ADMIN") return true;
      if (role === "INSTRUCTOR" && args.resource.instructorId === actor.id) return true;
      // Students read via an active enrollment.
      return Boolean(args.enrollment && args.enrollment.status === "ACTIVE");
    }
    case "course:update":
    case "course:publish":
    case "course:delete":
      if (role === "ADMIN") return true;
      return role === "INSTRUCTOR" && args.resource.instructorId === actor.id;

    // --- Lessons ---
    case "lesson:create": {
      if (role === "ADMIN") return true;
      return role === "INSTRUCTOR" && args.resource.instructorId === actor.id;
    }
    case "lesson:update":
    case "lesson:delete": {
      if (role === "ADMIN") return true;
      return role === "INSTRUCTOR" && args.resource.course.instructorId === actor.id;
    }
    case "lesson:view": {
      const { course, lesson, enrollment } = args.resource;
      if (role === "ADMIN") return true;
      if (role === "INSTRUCTOR" && course.instructorId === actor.id) return true;
      // Students only see published lessons, via active enrollment.
      if (role === "STUDENT") {
        return (
          lesson.isPublished &&
          Boolean(enrollment && enrollment.status === "ACTIVE")
        );
      }
      return false;
    }
    case "lesson:markComplete": {
      const { lesson, enrollment } = args.resource;
      // Only enrolled, active students may mark lessons complete.
      return (
        role === "STUDENT" &&
        lesson.isPublished &&
        Boolean(enrollment && enrollment.status === "ACTIVE")
      );
    }

    // --- Enrollments ---
    case "enrollment:manage":
      if (role === "ADMIN") return true;
      return role === "INSTRUCTOR" && args.resource.instructorId === actor.id;
    case "enrollment:list":
      return role === "ADMIN" || role === "INSTRUCTOR";

    // --- Quizzes (author side) ---
    case "quiz:manage": {
      const c = args.resource.course;
      if (role === "ADMIN") return true;
      return role === "INSTRUCTOR" && c.instructorId === actor.id;
    }
    // --- Quizzes (learner side) ---
    case "quiz:view":
    case "quiz:startAttempt": {
      const { course, enrollment } = args.resource;
      if (role === "ADMIN") return true;
      if (role === "INSTRUCTOR" && course.instructorId === actor.id) return true;
      if (role === "STUDENT")
        return Boolean(enrollment && enrollment.status === "ACTIVE");
      return false;
    }
    case "quiz:submitAttempt":
      // Only the student who owns the attempt may submit it.
      return role === "STUDENT" && args.resource.userId === actor.id;
    case "quiz:viewAttempt": {
      const { attempt, course } = args.resource;
      if (role === "ADMIN") return true;
      if (role === "INSTRUCTOR" && course.instructorId === actor.id) return true;
      return role === "STUDENT" && attempt.userId === actor.id;
    }

    // ── Invitations ──
    case "invitation:create":
    case "invitation:list":
    case "invitation:revoke":
    case "invitation:resend":
    case "auditLog:list":
      return role === "ADMIN";

    // ── Profile ──
    case "profile:update":
      return actor.id === args.resource.id;

    // ── AI ──
    case "ai:chat": {
      const { course, enrollment } = args.resource;
      if (role === "ADMIN") return true;
      if (role === "INSTRUCTOR" && course.instructorId === actor.id) return true;
      return role === "STUDENT" && Boolean(enrollment && enrollment.status === "ACTIVE");
    }
    case "ai:generateContent": {
      if (role === "ADMIN") return true;
      return role === "INSTRUCTOR" && args.resource.instructorId === actor.id;
    }

    // ── Forums ──
    case "forum:post": {
      const { course, enrollment } = args.resource;
      if (role === "ADMIN") return true;
      if (role === "INSTRUCTOR" && course.instructorId === actor.id) return true;
      return role === "STUDENT" && Boolean(enrollment && enrollment.status === "ACTIVE");
    }
    case "forum:moderate": {
      if (role === "ADMIN") return true;
      return role === "INSTRUCTOR" && args.resource.instructorId === actor.id;
    }
    case "forum:deleteOwn":
      return actor.id === args.resource.authorId;
  }
}

export function assertCan(actor: Actor | null, args: PermissionArgs): asserts actor is Actor {
  if (!actor) throw new UnauthorizedError();
  if (!actor.isActive) throw new ForbiddenError("Account is deactivated");
  if (!can(actor, args)) throw new ForbiddenError();
}
