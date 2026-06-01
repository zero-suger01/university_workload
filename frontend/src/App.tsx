import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from './store/authStore';
import type { AuthUser } from './store/authStore';
import { setInitPromise } from './lib/sessionManager';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RootLayout from './components/layout/RootLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import FacultyManagement from './pages/admin/FacultyManagement';
import CourseManagement from './pages/admin/CourseManagement';
import CourseCatalogPage from './pages/admin/CourseCatalogPage';
import ProgramsPage from './pages/admin/ProgramsPage';
import WorkloadAssignment from './pages/admin/WorkloadAssignment';
import RequestsOverview from './pages/admin/RequestsOverview';
import ReportsPage from './pages/admin/ReportsPage';
import SemesterManagement from './pages/admin/SemesterManagement';
import VacancyForecastPage from './pages/admin/VacancyForecastPage';
import RoomsPage from './pages/admin/RoomsPage';
import StudentCohortsPage from './pages/admin/StudentCohortsPage';
import CQIReviewPage from './pages/admin/CQIReviewPage';
import DepartmentsPage from './pages/admin/DepartmentsPage';
import FPIPage from './pages/admin/FPIPage';
import CoursePortfolioPage from './pages/admin/CoursePortfolioPage';
import CurriculumPage from './pages/admin/CurriculumPage';
import AcademicCalendarPage from './pages/admin/AcademicCalendarPage';

// Department Head pages
import HeadDashboard from './pages/department-head/HeadDashboard';
import RequestReview from './pages/department-head/RequestReview';


// Faculty pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import MyWorkload from './pages/faculty/MyWorkload';
import CQIPage from './pages/faculty/CQIPage';
import SubmitRequest from './pages/faculty/SubmitRequest';
import MyRequests from './pages/faculty/MyRequests';
import FacultyWorkloadRequests from './pages/faculty/FacultyWorkloadRequests';

// ─── Cookie yordamchi ────────────────────────────────────────────────────────
function getCookie(name: string): string | null {
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + '='));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return null;
  }
}

// ─── Singleton: StrictMode ikki marta chaqirilishini oldini oladi ────────────
// React StrictMode development rejimda useEffect ni ikki marta chaqiradi.
// Bu refresh token rotation bilan muammo yaratadi: birinchi refresh yangi token
// yaratadi va eskisini o'chiradi, ikkinchi muvaffaqiyatsiz bo'lib logout qiladi.
// Modul darajasidagi Promise buning oldini oladi.
let sessionRefreshPromise: Promise<void> | null = null;

// ─── Session Initializer ─────────────────────────────────────────────────────
function SessionInitializer() {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // Agar refresh allaqachon boshlangan bo'lsa, qayta boshlash yo'q
    if (sessionRefreshPromise) return;

    // ── 1. Tezkor render: userProfile cookie'dan ─────────────────────────
    const profileStr = getCookie('userProfile');
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr) as AuthUser;
        setAuth(profile);
      } catch {
        // Buzilgan cookie — e'tiborsiz qoldiramiz
      }
    }

    // ── 2. Singleton promise yaratamiz ───────────────────────────────────
    sessionRefreshPromise = axios
      .post<{ data: { user: AuthUser; accessToken: string } }>(
        '/api/auth/refresh',
        {},
        { withCredentials: true },
      )
      .then(({ data }) => {
        setAuth(data.data.user, data.data.accessToken);
      })
      .catch(() => {
        clearAuth();
      });

    // Share with the Axios interceptor so it doesn't race us
    setInitPromise(sessionRefreshPromise);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// ─── Role-based root redirect ────────────────────────────────────────────────
function RoleRedirect() {
  const { user, isInitialized } = useAuthStore();
  if (!isInitialized) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'DEPARTMENT_HEAD') return <Navigate to="/head/dashboard" replace />;
  return <Navigate to="/faculty/dashboard" replace />;
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SessionInitializer />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RoleRedirect />} />

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<RootLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/departments" element={<DepartmentsPage />} />
            <Route path="/admin/faculty" element={<FacultyManagement />} />
            <Route path="/admin/courses" element={<CourseManagement />} />
            <Route path="/admin/catalog" element={<CourseCatalogPage />} />
            <Route path="/admin/programs" element={<ProgramsPage />} />
            <Route path="/admin/semesters" element={<SemesterManagement />} />
            <Route path="/admin/workloads" element={<WorkloadAssignment />} />
            <Route path="/admin/requests" element={<RequestsOverview />} />
            <Route path="/admin/vacancy" element={<VacancyForecastPage />} />
            <Route path="/admin/rooms" element={<RoomsPage />} />
            <Route path="/admin/student-cohorts" element={<StudentCohortsPage />} />
            <Route path="/admin/cqi-review" element={<CQIReviewPage />} />
            <Route path="/admin/fpi" element={<FPIPage />} />
            <Route path="/admin/course-portfolio" element={<CoursePortfolioPage />} />
            <Route path="/admin/curriculum" element={<CurriculumPage />} />
            <Route path="/admin/calendar" element={<AcademicCalendarPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
          </Route>
        </Route>

        {/* Department Head routes — same pages as admin, read-only where restricted */}
        <Route element={<ProtectedRoute allowedRoles={['DEPARTMENT_HEAD']} />}>
          <Route element={<RootLayout />}>
            <Route path="/head/dashboard" element={<HeadDashboard />} />
            {/* Academic Administration — read-only (cannot create) */}
            <Route path="/head/semesters" element={<SemesterManagement readOnly />} />
            <Route path="/head/calendar" element={<AcademicCalendarPage readOnly />} />
            <Route path="/head/departments" element={<DepartmentsPage readOnly />} />
            <Route path="/head/programs" element={<ProgramsPage readOnly />} />
            <Route path="/head/curriculum" element={<CurriculumPage />} />
            <Route path="/head/catalog" element={<CourseCatalogPage readOnly />} />
            {/* Faculty Management — view only, no add */}
            <Route path="/head/faculty" element={<FacultyManagement />} />
            <Route path="/head/cqi-review" element={<CQIReviewPage />} />
            <Route path="/head/fpi" element={<FPIPage />} />
            {/* Workload — create only, assign tab hidden */}
            <Route path="/head/workloads" element={<WorkloadAssignment />} />
            <Route path="/head/requests" element={<RequestReview />} />
            {/* Other */}
            <Route path="/head/vacancy" element={<VacancyForecastPage />} />
            <Route path="/head/reports" element={<ReportsPage />} />
            {/* Legacy */}
            <Route path="/head/planning" element={<SemesterManagement readOnly />} />
          </Route>
        </Route>

        {/* Faculty routes */}
        <Route element={<ProtectedRoute allowedRoles={['FACULTY']} />}>
          <Route element={<RootLayout />}>
            <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
            <Route path="/faculty/workload" element={<MyWorkload />} />
            <Route path="/faculty/cqi" element={<CQIPage />} />
            <Route path="/faculty/requests/new" element={<SubmitRequest />} />
            <Route path="/faculty/requests" element={<MyRequests />} />
            <Route path="/faculty/workload-requests" element={<FacultyWorkloadRequests />} />
            {/* Academic Administration — read-only views */}
            <Route path="/faculty/academic/semesters" element={<SemesterManagement readOnly />} />
            <Route path="/faculty/academic/calendar" element={<AcademicCalendarPage readOnly />} />
            <Route path="/faculty/academic/schools" element={<DepartmentsPage readOnly />} />
            <Route path="/faculty/academic/programs" element={<ProgramsPage readOnly />} />
            <Route path="/faculty/academic/curriculum" element={<CurriculumPage />} />
            <Route path="/faculty/academic/catalog" element={<CourseCatalogPage readOnly />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
