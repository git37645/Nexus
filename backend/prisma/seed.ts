import { PrismaClient, Role, AccountStatus } from '@prisma/client'
import * as argon2 from 'argon2'
import crypto from 'crypto'

const prisma = new PrismaClient()

const isDev = process.env.NODE_ENV !== 'production'
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

async function createAdminSetupToken(email: string): Promise<string> {
  const rawToken = crypto.randomBytes(48).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  await prisma.user.update({
    where: { email },
    data: {
      setupToken: tokenHash,
      setupTokenExpiry: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
      isSetupComplete: false,
    },
  })

  return rawToken
}

async function main() {
  console.log('🌱 Seeding database...')

  // ──────────────────────────────────────────────────────────────────────────
  // FIRST ADMIN — ivanknyaze@gmail.com
  // Password is NOT set here. Admin sets it via a secure setup link.
  // ──────────────────────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'ivanknyaze@gmail.com'
  const adminUsername = process.env.ADMIN_USERNAME || 'ivan_admin'

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (!existingAdmin) {
    const unusablePasswordHash = await argon2.hash(crypto.randomBytes(64).toString('hex'))
    await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        passwordHash: unusablePasswordHash,
        role: Role.SUPERADMIN,
        status: AccountStatus.PENDING_VERIFICATION,
        emailVerified: true,
        isSetupComplete: false,
        profile: {
          create: { firstName: 'Ivan', lastName: 'Admin', faculty: 'Administration', department: 'IT' },
        },
        privacySettings: { create: {} },
      },
    })
  } else {
    // Ensure the admin has SUPERADMIN role regardless of how the account was created
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        role: Role.SUPERADMIN,
        username: adminUsername,
        emailVerified: true,
      },
    })
    // If no profile exists, create one
    const hasProfile = await prisma.profile.findUnique({ where: { userId: existingAdmin.id } })
    if (!hasProfile) {
      await prisma.profile.create({
        data: { userId: existingAdmin.id, firstName: 'Ivan', lastName: 'Admin' },
      })
    }
    // If no privacySettings, create them
    const hasPrivacy = await prisma.privacySettings.findUnique({ where: { userId: existingAdmin.id } })
    if (!hasPrivacy) {
      await prisma.privacySettings.create({ data: { userId: existingAdmin.id } })
    }
  }

  // Always generate a fresh setup token so the admin can always access the setup page
  const setupToken = await createAdminSetupToken(adminEmail)
  const setupLink = `${frontendUrl}/setup-admin?token=${setupToken}`

  console.log('')
  console.log('══════════════════════════════════════════════════════════════')
  console.log('  ADMIN SETUP LINK (valid for 72 hours)')
  console.log(`  Email:    ${adminEmail}`)
  console.log(`  Username: ${adminUsername}`)
  console.log('')
  console.log('  Use this link to set/reset your admin password:')
  console.log(`  ${setupLink}`)
  console.log('')
  console.log('  Keep this link private. It grants full SUPERADMIN access.')
  console.log('══════════════════════════════════════════════════════════════')
  console.log('')

  // ── Disable the old insecure dev admin account ───────────────────────────
  const oldDevAdmin = await prisma.user.findUnique({ where: { email: 'admin@local.dev' } })
  if (oldDevAdmin) {
    // Cannot delete due to FK constraints; instead block and randomize password
    const randomHash = await argon2.hash(crypto.randomBytes(64).toString('hex'))
    await prisma.user.update({
      where: { email: 'admin@local.dev' },
      data: {
        passwordHash: randomHash,
        status: AccountStatus.BLOCKED,
        username: null,
        role: Role.STUDENT,
      },
    })
    console.log('🔒 Old insecure dev account disabled: admin@local.dev (blocked, password randomized)')
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DEV-ONLY test accounts — only created when NODE_ENV !== 'production'
  // These are for local development testing only
  // ──────────────────────────────────────────────────────────────────────────
  if (isDev) {
    const teacherPassword = await argon2.hash('Teacher123!')
    const studentPassword = await argon2.hash('Student123!')

    const teacher1 = await prisma.user.upsert({
      where: { email: 'j.smith@nexus.university' },
      update: {},
      create: {
        email: 'j.smith@nexus.university',
        passwordHash: teacherPassword,
        role: Role.TEACHER,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
        profile: {
          create: {
            firstName: 'Jane',
            lastName: 'Smith',
            faculty: 'Faculty of Computer Science',
            department: 'Software Engineering',
          },
        },
        privacySettings: { create: {} },
      },
    })

    const teacher2 = await prisma.user.upsert({
      where: { email: 'm.brown@nexus.university' },
      update: {},
      create: {
        email: 'm.brown@nexus.university',
        passwordHash: teacherPassword,
        role: Role.TEACHER,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
        profile: {
          create: {
            firstName: 'Michael',
            lastName: 'Brown',
            faculty: 'Faculty of Mathematics',
            department: 'Applied Mathematics',
          },
        },
        privacySettings: { create: {} },
      },
    })

    const studentData = [
      { email: 'alice@student.nexus.university', first: 'Alice', last: 'Johnson', group: 'CS-301' },
      { email: 'bob@student.nexus.university', first: 'Bob', last: 'Williams', group: 'CS-301' },
      { email: 'carol@student.nexus.university', first: 'Carol', last: 'Davis', group: 'CS-302' },
      { email: 'dave@student.nexus.university', first: 'Dave', last: 'Miller', group: 'MATH-201' },
      { email: 'eve@student.nexus.university', first: 'Eve', last: 'Wilson', group: 'CS-301' },
    ]

    const students = []
    for (const s of studentData) {
      const student = await prisma.user.upsert({
        where: { email: s.email },
        update: {},
        create: {
          email: s.email,
          passwordHash: studentPassword,
          role: Role.STUDENT,
          status: AccountStatus.ACTIVE,
          emailVerified: true,
          profile: {
            create: {
              firstName: s.first,
              lastName: s.last,
              faculty: 'Faculty of Computer Science',
              group: s.group,
            },
          },
          privacySettings: { create: {} },
        },
      })
      students.push(student)
    }

    const course1 = await prisma.course.upsert({
      where: { code: 'CS401' },
      update: {},
      create: {
        teacherId: teacher1.id,
        name: 'Advanced Web Development',
        code: 'CS401',
        description: 'Modern full-stack web development with React, Node.js, and databases.',
        semester: 'Fall',
        year: 2024,
      },
    })

    const course2 = await prisma.course.upsert({
      where: { code: 'MATH301' },
      update: {},
      create: {
        teacherId: teacher2.id,
        name: 'Linear Algebra',
        code: 'MATH301',
        description: 'Vectors, matrices, eigenvalues, and linear transformations.',
        semester: 'Fall',
        year: 2024,
      },
    })

    for (const student of students.slice(0, 3)) {
      await prisma.courseMember.upsert({
        where: { courseId_userId: { courseId: course1.id, userId: student.id } },
        update: {},
        create: { courseId: course1.id, userId: student.id },
      })
    }
    for (const student of students.slice(3)) {
      await prisma.courseMember.upsert({
        where: { courseId_userId: { courseId: course2.id, userId: student.id } },
        update: {},
        create: { courseId: course2.id, userId: student.id },
      })
    }

    // Sample content — skip if already exists to prevent duplicates
    const existingLecture = await prisma.lecture.findFirst({ where: { courseId: course1.id } })
    if (!existingLecture) {
      await prisma.lecture.create({
        data: {
          courseId: course1.id,
          title: 'Introduction to REST APIs',
          description: 'Learn how to build RESTful APIs with Express and Node.js.',
          content: '# REST APIs\n\nREST (Representational State Transfer) is an architectural style...',
          order: 1,
          isPublished: true,
          publishedAt: new Date(),
        },
      })

      await prisma.assignment.create({
        data: {
          courseId: course1.id,
          title: 'Build a REST API',
          description: 'Create a simple REST API with CRUD operations.',
          instructions: 'Use Express.js to build a REST API for a todo list application.',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          maxScore: 100,
          allowedFileTypes: ['application/zip', 'application/x-zip-compressed'],
          allowResubmit: true,
        },
      })

      await prisma.post.create({
        data: {
          authorId: teacher1.id,
          content: '📢 Welcome to Advanced Web Development! Looking forward to a great semester.',
          visibility: 'UNIVERSITY',
        },
      })

      await prisma.post.create({
        data: {
          authorId: students[0].id,
          content: 'Just finished the first assignment! REST APIs are challenging but rewarding.',
          visibility: 'UNIVERSITY',
        },
      })
    }

    console.log('✅ Dev test accounts created:')
    console.log('   Teacher:  j.smith@nexus.university   / Teacher123!')
    console.log('   Student:  alice@student.nexus.university / Student123!')
  }

  console.log('✅ Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
