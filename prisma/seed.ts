import { PrismaClient, Role, BadgeSlug } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(plain: string) {
  return bcrypt.hash(plain, 12);
}

async function main() {
  console.log("Seeding database…");

  // --- Users ---
  const [adminHash, mara, lian, sam, jo, raj, eve, nia] = await Promise.all([
    hash("Admin123!"),
    hash("Instructor123!"),
    hash("Instructor123!"),
    hash("Student123!"),
    hash("Student123!"),
    hash("Student123!"),
    hash("Student123!"),
    hash("Student123!"),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@aklas.test" },
    update: {},
    create: {
      email: "admin@aklas.test",
      name: "Alex Admin",
      role: Role.ADMIN,
      passwordHash: adminHash,
    },
  });

  const instructorMara = await prisma.user.upsert({
    where: { email: "mara@aklas.test" },
    update: {},
    create: {
      email: "mara@aklas.test",
      name: "Mara Instructor",
      role: Role.INSTRUCTOR,
      passwordHash: mara,
    },
  });

  const instructorLian = await prisma.user.upsert({
    where: { email: "lian@aklas.test" },
    update: {},
    create: {
      email: "lian@aklas.test",
      name: "Lian Instructor",
      role: Role.INSTRUCTOR,
      passwordHash: lian,
    },
  });

  const studentSeeds = [
    { email: "sam@aklas.test", name: "Sam Student", h: sam },
    { email: "jo@aklas.test", name: "Jo Student", h: jo },
    { email: "raj@aklas.test", name: "Raj Student", h: raj },
    { email: "eve@aklas.test", name: "Eve Student", h: eve },
    { email: "nia@aklas.test", name: "Nia Student", h: nia },
  ];
  const students = [] as Array<{ id: string; email: string }>;
  for (const s of studentSeeds) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { email: s.email, name: s.name, role: Role.STUDENT, passwordHash: s.h },
    });
    students.push({ id: u.id, email: u.email });
  }

  // --- Course 1: Intro to Electronics (Mara) ---
  const electronics = await prisma.course.upsert({
    where: { slug: "intro-to-electronics" },
    update: {},
    create: {
      slug: "intro-to-electronics",
      title: "Introduction to Electronics",
      description:
        "Circuits, Ohm's law, and your first Arduino project — a foundation course for first-year engineering students.",
      instructorId: instructorMara.id,
      isPublished: true,
      lessons: {
        create: [
          {
            order: 1,
            title: "Ohm's Law and Basic Circuits",
            contentMd:
              "# Ohm's Law\n\nV = I × R. In this lesson we explore how voltage, current, and resistance relate in simple resistive circuits.",
            videoUrl: "https://www.youtube.com/embed/HRR86xG_OuQ",
            isPublished: true,
          },
          {
            order: 2,
            title: "Your First Arduino Blink",
            contentMd:
              "# Blink\n\nDrive an LED from a digital pin. Use the embedded simulator on the right to experiment before touching real hardware.",
            simulatorKey: "wokwi",
            simulatorConfig: {
              // Tells the iframe adapter what to embed.
              src: "https://wokwi.com/projects/new/arduino-uno",
            },
            isPublished: true,
          },
          {
            order: 3,
            title: "Pull-up Resistors and Buttons",
            contentMd:
              "# Pull-ups\n\nWhy a floating pin is a bug, and how a pull-up resistor fixes it.",
            isPublished: true,
          },
        ],
      },
    },
    include: { lessons: true },
  });

  // Attach a quiz to lesson 1 of Electronics.
  const ohmLesson = electronics.lessons.find((l) => l.order === 1);
  if (ohmLesson) {
    const existing = await prisma.quiz.findUnique({ where: { lessonId: ohmLesson.id } });
    if (!existing) {
      await prisma.quiz.create({
        data: {
          lessonId: ohmLesson.id,
          title: "Ohm's Law Quiz",
          passingScore: 70,
          questions: {
            create: [
              {
                order: 1,
                text: "If V = 10 V and R = 2 Ω, what is I?",
                options: {
                  create: [
                    { text: "0.2 A", isCorrect: false },
                    { text: "5 A", isCorrect: true },
                    { text: "20 A", isCorrect: false },
                    { text: "12 A", isCorrect: false },
                  ],
                },
              },
              {
                order: 2,
                text: "Doubling the resistance while holding voltage constant:",
                options: {
                  create: [
                    { text: "Doubles the current", isCorrect: false },
                    { text: "Halves the current", isCorrect: true },
                    { text: "Leaves current unchanged", isCorrect: false },
                  ],
                },
              },
              {
                order: 3,
                text: "Power dissipated in a resistor is best expressed as:",
                options: {
                  create: [
                    { text: "P = V × I", isCorrect: true },
                    { text: "P = V / I", isCorrect: false },
                    { text: "P = V + I", isCorrect: false },
                  ],
                },
              },
              {
                order: 4,
                text: "Which unit measures resistance?",
                options: {
                  create: [
                    { text: "Ampere", isCorrect: false },
                    { text: "Volt", isCorrect: false },
                    { text: "Ohm", isCorrect: true },
                    { text: "Watt", isCorrect: false },
                  ],
                },
              },
              {
                order: 5,
                text: "In a series circuit, the total resistance equals:",
                options: {
                  create: [
                    { text: "The average of each resistor", isCorrect: false },
                    { text: "The product of each resistor", isCorrect: false },
                    { text: "The sum of each resistor", isCorrect: true },
                  ],
                },
              },
            ],
          },
        },
      });
    }
  }

  // --- Course 2: Python Fundamentals (Lian) ---
  await prisma.course.upsert({
    where: { slug: "python-fundamentals" },
    update: {},
    create: {
      slug: "python-fundamentals",
      title: "Python Fundamentals",
      description:
        "Variables, control flow, functions, and data structures. No prior programming experience required.",
      instructorId: instructorLian.id,
      isPublished: true,
      lessons: {
        create: [
          {
            order: 1,
            title: "Variables and Types",
            contentMd: "# Variables\n\nNames bound to values. Python is dynamically typed but strongly typed.",
            isPublished: true,
          },
          {
            order: 2,
            title: "Control Flow",
            contentMd: "# if / elif / else\n\nBranching on boolean expressions.",
            isPublished: true,
          },
          {
            order: 3,
            title: "Functions",
            contentMd: "# Functions\n\n`def`, positional vs keyword arguments, default values.",
            isPublished: false, // deliberately unpublished to test progress math
          },
        ],
      },
    },
  });

  // --- Enrollments: everyone in Electronics; Sam+Jo also in Python ---
  const allCourses = await prisma.course.findMany({ where: { deletedAt: null } });
  const electronicsCourse = allCourses.find((c) => c.slug === "intro-to-electronics")!;
  const pythonCourse = allCourses.find((c) => c.slug === "python-fundamentals")!;

  for (const s of students) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: s.id, courseId: electronicsCourse.id } },
      update: {},
      create: { userId: s.id, courseId: electronicsCourse.id },
    });
  }
  for (const s of students.slice(0, 2)) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: s.id, courseId: pythonCourse.id } },
      update: {},
      create: { userId: s.id, courseId: pythonCourse.id },
    });
  }

  // --- Badges ---
  const badges: Array<{ slug: BadgeSlug; name: string; description: string; iconName: string; xpReward: number }> = [
    { slug: "FIRST_LESSON", name: "First Step", description: "Completed your first lesson.", iconName: "BookOpen", xpReward: 0 },
    { slug: "FIRST_QUIZ_PASS", name: "Quiz Taker", description: "Passed your first quiz.", iconName: "CheckCircle2", xpReward: 0 },
    { slug: "STREAK_7", name: "On a Roll", description: "Maintained a 7-day learning streak.", iconName: "Flame", xpReward: 50 },
    { slug: "STREAK_30", name: "Unstoppable", description: "Maintained a 30-day learning streak.", iconName: "Zap", xpReward: 200 },
    { slug: "COURSE_COMPLETE", name: "Graduate", description: "Completed your first course.", iconName: "GraduationCap", xpReward: 100 },
    { slug: "PERFECT_QUIZ", name: "Perfectionist", description: "Scored 100% on a quiz.", iconName: "Star", xpReward: 25 },
    { slug: "SPEED_LEARNER", name: "Speed Learner", description: "Completed a course in record time.", iconName: "Rocket", xpReward: 50 },
    { slug: "EARLY_ADOPTER", name: "Early Adopter", description: "One of the first students on the platform.", iconName: "Award", xpReward: 10 },
  ];
  for (const b of badges) {
    await prisma.badge.upsert({
      where: { slug: b.slug },
      update: { name: b.name, description: b.description, iconName: b.iconName, xpReward: b.xpReward },
      create: b,
    });
  }

  console.log("\nSeed complete.");
  console.log("Admin:       admin@aklas.test / Admin123!");
  console.log("Instructor:  mara@aklas.test  / Instructor123!");
  console.log("Student:     sam@aklas.test   / Student123!");
  console.log(`\n${1 + 2 + students.length} users, ${allCourses.length} courses seeded.`);
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
