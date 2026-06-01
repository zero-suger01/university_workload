interface HourBreakdown {
  lectureHours: number;
  seminarHours: number;
  labHours: number;
  advisingHours: number;
  researchHours: number;
  adminHours: number;
  otherHours: number;
}

export function calculateTotalHours(hours: HourBreakdown): number {
  return (
    hours.lectureHours +
    hours.seminarHours +
    hours.labHours +
    hours.advisingHours +
    hours.researchHours +
    hours.adminHours +
    hours.otherHours
  );
}

export function computeLoadFlags(
  totalHours: number,
  maxWeeklyHours: number,
  minWeeklyHours: number,
) {
  return {
    isOverloaded: totalHours > maxWeeklyHours,
    isUnderloaded: totalHours < minWeeklyHours,
  };
}

/**
 * Calculate professor's total workload hours.
 * Lecture is taught to all groups together (no multiplication).
 * Tutorial and Lab are taught per group (multiplied by group count).
 */
export function calculateProfessorWorkload(
  hours: HourBreakdown & { groupCount?: number },
): number {
  const gc = hours.groupCount && hours.groupCount > 0 ? hours.groupCount : 1;
  return (
    (hours.lectureHours || 0) +
    (hours.seminarHours || 0) * gc +
    (hours.labHours || 0) * gc +
    (hours.advisingHours || 0) +
    (hours.researchHours || 0) +
    (hours.adminHours || 0) +
    (hours.otherHours || 0)
  );
}
