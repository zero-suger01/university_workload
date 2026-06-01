import api from './client';

export const workloadsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/workloads', { params }).then((r) => r.data),

  summary: (semesterId: string) =>
    api.get('/workloads/summary', { params: { semesterId } }).then((r) => r.data.data),

  getById: (id: string) => api.get(`/workloads/${id}`).then((r) => r.data.data),

  create: (data: Record<string, unknown>) =>
    api.post('/workloads', data).then((r) => r.data.data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/workloads/${id}`, data).then((r) => r.data.data),

  delete: (id: string) => api.delete(`/workloads/${id}`),

  /** Returns all unique group codes from StudentCohorts */
  getGroupCodes: () =>
    api.get('/workloads/group-codes').then((r) => r.data.data as string[]),

  /** Check which of the given codes are already assigned to another faculty for the semester */
  checkGroupCodeConflicts: (semesterId: string, codes: string[], excludeId?: string) =>
    api
      .get('/workloads/group-code-conflicts', {
        params: { semesterId, codes: codes.join(','), excludeId },
      })
      .then(
        (r) =>
          r.data.data as { groupCode: string; faculty: { id: string; firstName: string; lastName: string } }[],
      ),

  approve: (id: string) =>
    api.patch(`/workloads/${id}/approve`).then((r) => r.data.data),

  reject: (id: string, reason: string) =>
    api.patch(`/workloads/${id}/reject`, { reason }).then((r) => r.data.data),

  /** Get all assignments for a course+semester with required/covered/uncovered totals */
  getCourseAssignments: (courseId: string, semesterId: string) =>
    api
      .get('/workloads/course-assignments', { params: { courseId, semesterId } })
      .then((r) => r.data.data as {
        course: { id: string; courseCode: string; title: string; ectsCredits: number | null; departmentId: string };
        semester: { id: string; name: string; weekCount: number };
        required: { lecture: number; tutorial: number; lab: number; total: number };
        covered: { lecture: number; tutorial: number; lab: number; total: number };
        uncovered: { lecture: number; tutorial: number; lab: number; total: number };
        assignments: any[];
        planningRow: any;
      }),
};
