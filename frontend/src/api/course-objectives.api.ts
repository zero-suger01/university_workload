import api from './client';

export const courseObjectivesApi = {
  getByCourse: (courseId: string) =>
    api.get(`/course-objectives/by-course/${courseId}`).then((r) => r.data),
  upsertForCourse: (courseId: string, objectives: Record<string, unknown>[]) =>
    api.put(`/course-objectives/by-course/${courseId}`, { objectives }).then((r) => r.data),
};
