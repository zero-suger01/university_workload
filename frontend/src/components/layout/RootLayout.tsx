import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import Header from './Header';

const PAGE_TITLE_KEYS: Record<string, string> = {
  '/admin/dashboard': 'pageDashboard',
  '/admin/faculty': 'pageFacultyManagement',
  '/admin/courses': 'pageCourseManagement',
  '/admin/semesters': 'pageSemesterManagement',
  '/admin/workloads': 'pageWorkloadAssignment',
  '/admin/requests': 'pageRequestsOverview',
  '/admin/reports': 'pageReports',
  '/admin/departments': 'pageDepartments',
  '/admin/catalog': 'pageCourseCatalog',
  '/admin/programs': 'pagePrograms',
  '/admin/vacancy': 'pageVacancyForecast',
  '/admin/rooms': 'pageRooms',
  '/admin/student-cohorts': 'pageStudentCohorts',
  '/admin/cqi-review': 'pageCQIReview',
  '/head/dashboard': 'pageDashboard',
  '/head/workloads': 'pageDepartmentWorkloads',
  '/head/planning': 'pageSemesterPlanning',
  '/head/vacancy': 'pageVacancyForecast',
  '/head/requests': 'pageRequestReview',
  '/faculty/dashboard': 'pageMyDashboard',
  '/faculty/workload': 'pageMyWorkload',
  '/faculty/cqi': 'pageCQIReports',
  '/faculty/requests/new': 'pageSubmitRequest',
  '/faculty/requests': 'pageMyRequests',
};

export default function RootLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const titleKey = PAGE_TITLE_KEYS[pathname] ?? 'workloadManagement';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header title={t(titleKey)} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
