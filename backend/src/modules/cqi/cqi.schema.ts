// @ts-nocheck
import { z } from 'zod';

const syllabusWeekSchema = z.object({
  week: z.number().int().min(1).max(20),
  date: z.string().optional(),
  topic: z.string().min(1),
  tutorials: z.string().optional(),
});

const cloSchema = z.object({
  cloNumber: z.number().int().min(1),
  description: z.string().min(1),
  teachingMethods: z.array(z.string()).default([]),
  assessmentTools: z.array(z.string()).default([]),
  perfHigh: z.string().optional(),
  perfMedium: z.string().optional(),
  perfLow: z.string().optional(),
  plosHigh: z.array(z.string()).default([]),
  plosMedium: z.array(z.string()).default([]),
  plosLow: z.array(z.string()).default([]),
});

export const cqiSchema = z.object({
  courseId: z.string().min(1),
  semesterId: z.string().min(1),
  studentCount: z.number().int().min(0).default(0),
  evalMidterm: z.number().min(0).max(100).default(40),
  evalFinal: z.number().min(0).max(100).default(40),
  evalAssignment: z.number().min(0).max(100).default(20),
  textbooks: z.array(z.string()).default([]),
  evalQ1Answer: z.string().optional(),
  evalQ2Answer: z.string().optional(),
  evalQ3Answer: z.string().optional(),
  evalQ4Answer: z.string().optional(),
  surveyParticipation: z.number().int().optional(),
  surveyFollowsSyllabus: z.number().optional(),
  surveySatisfaction: z.number().optional(),
  surveyAvgScore: z.number().optional(),
  syllabus: z.array(syllabusWeekSchema).optional(),
  cloAssessments: z.array(cloSchema).optional(),
});

export const updateCqiSchema = cqiSchema.partial();
