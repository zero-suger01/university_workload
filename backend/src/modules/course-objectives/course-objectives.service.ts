// @ts-nocheck
import { prisma } from '../../config/database';

export async function getByCourse(courseId: string) {
  return prisma.courseObjective.findMany({
    where: { courseId },
    orderBy: { number: 'asc' },
  });
}

export async function upsertForCourse(courseId: string, objectives: { number: number; description: string }[]) {
  // Delete all existing objectives for the course
  await prisma.courseObjective.deleteMany({ where: { courseId } });

  // Create new objectives
  const created = await prisma.courseObjective.createMany({
    data: objectives.map((o) => ({
      courseId,
      number: o.number,
      description: o.description,
    })),
  });

  return prisma.courseObjective.findMany({
    where: { courseId },
    orderBy: { number: 'asc' },
  });
}
