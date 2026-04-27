import { describe, expect, it } from "vitest";
import { can, type Actor } from "@/services/authorization";

const admin: Actor = { id: "admin1", role: "ADMIN", isActive: true };
const instructor: Actor = { id: "instructor1", role: "INSTRUCTOR", isActive: true };
const otherInstructor: Actor = { id: "instructor2", role: "INSTRUCTOR", isActive: true };
const student: Actor = { id: "student1", role: "STUDENT", isActive: true };
const inactiveUser: Actor = { id: "inactive1", role: "STUDENT", isActive: false };

const ownCourse = { id: "course1", instructorId: instructor.id };
const otherCourse = { id: "course2", instructorId: otherInstructor.id };
const publishedLesson = { id: "lesson1", courseId: "course1", isPublished: true };
const draftLesson = { id: "lesson2", courseId: "course1", isPublished: false };
const activeEnrollment = {
  id: "enroll1",
  userId: student.id,
  courseId: "course1",
  status: "ACTIVE" as const,
};
const revokedEnrollment = { ...activeEnrollment, status: "REVOKED" as const };
const submittedAttempt = {
  id: "attempt1",
  userId: student.id,
  submittedAt: new Date(),
};
const openAttempt = { id: "attempt2", userId: student.id, submittedAt: null };

describe("authorization — inactive actor", () => {
  it("always returns false for inactive users", () => {
    expect(can(inactiveUser, { action: "course:list" })).toBe(false);
    expect(can(null, { action: "course:list" })).toBe(false);
  });
});

describe("authorization — user management (admin-only)", () => {
  it("admin can create/list/update/delete users", () => {
    expect(can(admin, { action: "user:create" })).toBe(true);
    expect(can(admin, { action: "user:list" })).toBe(true);
    expect(can(admin, { action: "user:changeRole", resource: { id: "u1" } })).toBe(true);
    expect(can(admin, { action: "user:deactivate", resource: { id: "u1" } })).toBe(true);
    expect(can(admin, { action: "user:delete", resource: { id: "u1" } })).toBe(true);
  });

  it("instructor cannot manage users", () => {
    expect(can(instructor, { action: "user:create" })).toBe(false);
    expect(can(instructor, { action: "user:list" })).toBe(false);
  });

  it("student cannot manage users", () => {
    expect(can(student, { action: "user:create" })).toBe(false);
  });
});

describe("authorization — courses", () => {
  it("admin can perform all course actions", () => {
    expect(can(admin, { action: "course:create" })).toBe(true);
    expect(can(admin, { action: "course:update", resource: otherCourse })).toBe(true);
    expect(can(admin, { action: "course:delete", resource: otherCourse })).toBe(true);
    expect(can(admin, { action: "course:publish", resource: otherCourse })).toBe(true);
  });

  it("instructor can manage own courses", () => {
    expect(can(instructor, { action: "course:create" })).toBe(true);
    expect(can(instructor, { action: "course:update", resource: ownCourse })).toBe(true);
    expect(can(instructor, { action: "course:delete", resource: ownCourse })).toBe(true);
  });

  it("instructor cannot manage other instructor's courses", () => {
    expect(can(instructor, { action: "course:update", resource: otherCourse })).toBe(false);
    expect(can(instructor, { action: "course:delete", resource: otherCourse })).toBe(false);
    expect(can(instructor, { action: "course:publish", resource: otherCourse })).toBe(false);
  });

  it("student cannot create or modify courses", () => {
    expect(can(student, { action: "course:create" })).toBe(false);
    expect(can(student, { action: "course:update", resource: ownCourse })).toBe(false);
  });

  it("student reads course only with active enrollment", () => {
    expect(
      can(student, { action: "course:read", resource: ownCourse, enrollment: activeEnrollment }),
    ).toBe(true);
    expect(
      can(student, { action: "course:read", resource: ownCourse, enrollment: revokedEnrollment }),
    ).toBe(false);
    expect(
      can(student, { action: "course:read", resource: ownCourse, enrollment: null }),
    ).toBe(false);
  });
});

describe("authorization — lessons", () => {
  it("instructor can author lessons on own course only", () => {
    expect(can(instructor, { action: "lesson:create", resource: ownCourse })).toBe(true);
    expect(can(instructor, { action: "lesson:create", resource: otherCourse })).toBe(false);
  });

  it("student can view published lesson with active enrollment", () => {
    expect(
      can(student, {
        action: "lesson:view",
        resource: { course: ownCourse, lesson: publishedLesson, enrollment: activeEnrollment },
      }),
    ).toBe(true);
  });

  it("student cannot view draft lesson even with active enrollment", () => {
    expect(
      can(student, {
        action: "lesson:view",
        resource: { course: ownCourse, lesson: draftLesson, enrollment: activeEnrollment },
      }),
    ).toBe(false);
  });

  it("student cannot view published lesson with revoked enrollment", () => {
    expect(
      can(student, {
        action: "lesson:view",
        resource: { course: ownCourse, lesson: publishedLesson, enrollment: revokedEnrollment },
      }),
    ).toBe(false);
  });

  it("student can only mark published lessons complete with active enrollment", () => {
    expect(
      can(student, {
        action: "lesson:markComplete",
        resource: { course: ownCourse, lesson: publishedLesson, enrollment: activeEnrollment },
      }),
    ).toBe(true);
    expect(
      can(student, {
        action: "lesson:markComplete",
        resource: { course: ownCourse, lesson: draftLesson, enrollment: activeEnrollment },
      }),
    ).toBe(false);
  });
});

describe("authorization — quiz attempts", () => {
  it("student can submit own open attempt", () => {
    expect(can(student, { action: "quiz:submitAttempt", resource: openAttempt })).toBe(true);
  });

  it("student cannot submit another student's attempt", () => {
    const otherAttempt = { ...openAttempt, userId: "other-student" };
    expect(can(student, { action: "quiz:submitAttempt", resource: otherAttempt })).toBe(false);
  });

  it("instructor cannot submit student attempts", () => {
    expect(can(instructor, { action: "quiz:submitAttempt", resource: openAttempt })).toBe(false);
  });
});
