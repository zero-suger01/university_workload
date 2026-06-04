import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  FileText,
  CalendarDays,
  CalendarCheck,
  CalendarRange,
  Building2,
  Send,
  Inbox,
  X,
  GraduationCap,
  DoorOpen,
  Users2,
  ClipboardCheck,
  FileCheck,
  ChevronDown,
  BarChart2,
  BookMarked,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const facultyPaths = ['/admin/faculty'];
  const workloadPaths = [
    '/admin/workloads', '/admin/student-cohorts', '/admin/rooms', '/admin/requests',
  ];
  const academicPaths = [
    '/admin/semesters', '/admin/calendar', '/admin/departments',
    '/admin/programs', '/admin/curriculum', '/admin/catalog',
  ];

  const facultyActive = facultyPaths.some((p) => location.pathname.startsWith(p));
  const workloadActive = workloadPaths.some((p) => location.pathname.startsWith(p));
  const academicActive = academicPaths.some((p) => location.pathname.startsWith(p));

  const [facultyOpen, setFacultyOpen] = useState(facultyActive);
  const [workloadOpen, setWorkloadOpen] = useState(workloadActive);
  const [academicOpen, setAcademicOpen] = useState(academicActive);



  const facultyRequestPaths = ['/faculty/requests', '/faculty/workload-requests'];
  const [facultyRequestsOpen, setFacultyRequestsOpen] = useState(
    facultyRequestPaths.some(p => location.pathname.startsWith(p))
  );
  const [facultyAcademicOpen, setFacultyAcademicOpen] = useState(
    location.pathname.startsWith('/faculty/academic')
  );

  const isAdmin = user?.role === 'ADMIN';

  const linkClass = (active: boolean) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-primary-700 text-white'
        : 'text-white/70 hover:bg-primary-800 hover:text-white'
    }`;

  const subLinkClass = (active: boolean) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-primary-700 text-white font-medium'
        : 'text-white/60 hover:bg-primary-800 hover:text-white'
    }`;

  const sidebarClass = [
    'flex flex-col h-full bg-primary-900 border-r border-primary-800 w-72 flex-shrink-0',
    'fixed inset-y-0 left-0 z-30',
    'transition-transform duration-300 ease-in-out',
    isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
    'lg:static lg:translate-x-0 lg:shadow-none lg:z-auto',
  ].join(' ');

  const brand = (
    <div className="h-14 px-4 border-b border-primary-800 flex items-center justify-between flex-shrink-0 bg-primary-900">
      <div className="flex items-center gap-3">
        <div className="bg-white rounded-xl p-1.5 flex-shrink-0 shadow-sm">
          <img src="/npuu-logo.png" alt="NPUU Logo" className="w-8 h-8 object-contain" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none tracking-wide">NPUU</p>
          <p className="text-[11px] text-white/80 leading-tight mt-0.5">Workload System</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="lg:hidden p-1.5 rounded-md text-white/60 hover:text-white hover:bg-primary-800 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  const userFooter = (
    <div className="border-t border-primary-800 p-3 flex-shrink-0">
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white uppercase">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white truncate leading-tight">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-[11px] text-white/60 truncate">{user?.department?.name}</p>
        </div>
      </div>
    </div>
  );

  if (isAdmin) {
    return (
      <aside className={sidebarClass}>
        {brand}

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {/* 1. Dashboard */}
          <NavLink to="/admin/dashboard" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            Dashboard
          </NavLink>

          {/* 2. Academic Administration */}
          <div>
            <button
              onClick={() => setAcademicOpen((o) => !o)}
              className={`${linkClass(academicActive)} w-full`}
            >
              <CalendarDays className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Academic Administration</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${academicOpen ? 'rotate-180' : ''}`} />
            </button>
            {academicOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
                <NavLink to="/admin/semesters" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <CalendarCheck className="w-3.5 h-3.5 flex-shrink-0" /> Semester
                </NavLink>
                <NavLink to="/admin/calendar" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <CalendarRange className="w-3.5 h-3.5 flex-shrink-0" /> Calendar
                </NavLink>
                <NavLink to="/admin/departments" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" /> Schools
                </NavLink>
                <NavLink to="/admin/programs" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" /> Programs
                </NavLink>
                <NavLink to="/admin/curriculum" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <BookMarked className="w-3.5 h-3.5 flex-shrink-0" /> Curriculum
                </NavLink>
                <NavLink to="/admin/catalog" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <BookOpen className="w-3.5 h-3.5 flex-shrink-0" /> Course Catalog
                </NavLink>
              </div>
            )}
          </div>

          {/* 3. Faculty Management accordion */}
          <div>
            <button
              onClick={() => setFacultyOpen((o) => !o)}
              className={`${linkClass(facultyActive)} w-full`}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Faculty Management</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${facultyOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {facultyOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
                <NavLink to="/admin/faculty" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <Users className="w-3.5 h-3.5 flex-shrink-0" /> Academic Staff
                </NavLink>
              </div>
            )}
          </div>

          {/* 4. Workload accordion */}
          <div>
            <button
              onClick={() => setWorkloadOpen((o) => !o)}
              className={`${linkClass(workloadActive)} w-full`}
            >
              <ClipboardList className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Workload Assignment</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${workloadOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {workloadOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
                <NavLink to="/admin/workloads" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <Users className="w-3.5 h-3.5 flex-shrink-0" /> Workload
                </NavLink>
                <NavLink to="/admin/student-cohorts" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <Users2 className="w-3.5 h-3.5 flex-shrink-0" /> Student Cohorts
                </NavLink>
                <NavLink to="/admin/rooms" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <DoorOpen className="w-3.5 h-3.5 flex-shrink-0" /> Rooms
                </NavLink>
                <NavLink to="/admin/requests" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <Inbox className="w-3.5 h-3.5 flex-shrink-0" /> Request
                </NavLink>
              </div>
            )}
          </div>

          {/* 5. Load Stat - Forecast */}
          <NavLink to="/admin/vacancy" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
            <BarChart2 className="w-4 h-4 flex-shrink-0" />
            Load Stat - Forecast
          </NavLink>

          {/* 6. Report */}
          <NavLink to="/admin/reports" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
            <FileText className="w-4 h-4 flex-shrink-0" />
            Report
          </NavLink>
        </nav>

        {userFooter}
      </aside>
    );
  }

  // Department Head & Faculty navigation

  if (user?.role === 'DEPARTMENT_HEAD') {
    const headAcademicPaths = ['/head/semesters','/head/calendar','/head/departments','/head/programs','/head/curriculum','/head/catalog'];
    const headFacultyPaths = ['/head/faculty','/head/cqi-review','/head/fpi'];
    const headWorkloadPaths = ['/head/workloads','/head/requests'];
    const headAcademicActive = headAcademicPaths.some(p => location.pathname.startsWith(p));
    const headFacultyActive = headFacultyPaths.some(p => location.pathname.startsWith(p));
    const headWorkloadActive = headWorkloadPaths.some(p => location.pathname.startsWith(p));
    return (
      <aside className={sidebarClass}>
        {brand}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {/* Dashboard */}
          <NavLink to="/head/dashboard" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" /> Dashboard
          </NavLink>

          {/* Academic Administration — view only */}
          <div>
            <button onClick={() => setAcademicOpen(o => !o)} className={`${linkClass(headAcademicActive)} w-full`}>
              <CalendarDays className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Academic Administration</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${academicOpen ? 'rotate-180' : ''}`} />
            </button>
            {academicOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
                <NavLink to="/head/semesters" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <CalendarCheck className="w-3.5 h-3.5 flex-shrink-0" /> Semester
                </NavLink>
                <NavLink to="/head/calendar" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <CalendarRange className="w-3.5 h-3.5 flex-shrink-0" /> Calendar
                </NavLink>
                <NavLink to="/head/departments" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" /> Schools
                </NavLink>
                <NavLink to="/head/programs" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" /> Programs
                </NavLink>
                <NavLink to="/head/curriculum" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <BookMarked className="w-3.5 h-3.5 flex-shrink-0" /> Curriculum
                </NavLink>
                <NavLink to="/head/catalog" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <BookOpen className="w-3.5 h-3.5 flex-shrink-0" /> Course Catalog
                </NavLink>
              </div>
            )}
          </div>

          {/* Faculty Management — view only, no add */}
          <div>
            <button onClick={() => setFacultyOpen(o => !o)} className={`${linkClass(headFacultyActive)} w-full`}>
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Faculty Management</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${facultyOpen ? 'rotate-180' : ''}`} />
            </button>
            {facultyOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
                <NavLink to="/head/faculty" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <Users className="w-3.5 h-3.5 flex-shrink-0" /> Academic Staff
                </NavLink>
                <NavLink to="/head/cqi-review" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <ClipboardCheck className="w-3.5 h-3.5 flex-shrink-0" /> CQI Review
                </NavLink>
                <NavLink to="/head/fpi" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <FileText className="w-3.5 h-3.5 flex-shrink-0" /> FPI
                </NavLink>
              </div>
            )}
          </div>

          {/* Workload — create only, no assign */}
          <div>
            <button onClick={() => setWorkloadOpen(o => !o)} className={`${linkClass(headWorkloadActive)} w-full`}>
              <ClipboardList className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Workload Assignment</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${workloadOpen ? 'rotate-180' : ''}`} />
            </button>
            {workloadOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
                <NavLink to="/head/workloads" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <Users className="w-3.5 h-3.5 flex-shrink-0" /> Workload
                </NavLink>
                <NavLink to="/head/requests" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                  <Inbox className="w-3.5 h-3.5 flex-shrink-0" /> Request
                </NavLink>
              </div>
            )}
          </div>

          {/* Load Stat - Forecast */}
          <NavLink to="/head/vacancy" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
            <BarChart2 className="w-4 h-4 flex-shrink-0" /> Load Stat - Forecast
          </NavLink>

          {/* Report */}
          <NavLink to="/head/reports" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
            <FileText className="w-4 h-4 flex-shrink-0" /> Report
          </NavLink>
        </nav>
        {userFooter}
      </aside>
    );
  }

  // Faculty sidebar
  return (
    <aside className={sidebarClass}>
      {brand}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {/* Dashboard */}
        <NavLink to="/faculty/dashboard" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" /> {t('dashboard')}
        </NavLink>

        {/* My Workload */}
        <NavLink to="/faculty/workload" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
          <ClipboardList className="w-4 h-4 flex-shrink-0" /> {t('myWorkload')}
        </NavLink>

        {/* Academic Administration accordion */}
        <div>
          <button
            onClick={() => setFacultyAcademicOpen(o => !o)}
            className={`${linkClass(location.pathname.startsWith('/faculty/academic'))} w-full`}
          >
            <CalendarDays className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">Academic Administration</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${facultyAcademicOpen ? 'rotate-180' : ''}`} />
          </button>
          {facultyAcademicOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
              <NavLink to="/faculty/academic/semesters" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                <CalendarCheck className="w-3.5 h-3.5 flex-shrink-0" /> Semester
              </NavLink>
              <NavLink to="/faculty/academic/calendar" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                <CalendarRange className="w-3.5 h-3.5 flex-shrink-0" /> Calendar
              </NavLink>
              <NavLink to="/faculty/academic/schools" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" /> School
              </NavLink>
              <NavLink to="/faculty/academic/programs" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" /> Programs
              </NavLink>
              <NavLink to="/faculty/academic/curriculum" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                <BookOpen className="w-3.5 h-3.5 flex-shrink-0" /> Curriculum
              </NavLink>
              <NavLink to="/faculty/academic/catalog" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                <BookMarked className="w-3.5 h-3.5 flex-shrink-0" /> Course Catalog
              </NavLink>
            </div>
          )}
        </div>

        {/* CQI Reports */}
        <NavLink to="/faculty/cqi" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
          <FileCheck className="w-4 h-4 flex-shrink-0" /> CQI Reports
        </NavLink>

        {/* Requests accordion */}
        <div>
          <button
            onClick={() => setFacultyRequestsOpen(o => !o)}
            className={`${linkClass(facultyRequestPaths.some(p => location.pathname.startsWith(p)))} w-full`}
          >
            <Inbox className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">Requests</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${facultyRequestsOpen ? 'rotate-180' : ''}`} />
          </button>
          {facultyRequestsOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
              <NavLink to="/faculty/requests/new" onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                <Send className="w-3.5 h-3.5 flex-shrink-0" /> New Request
              </NavLink>
              <NavLink to="/faculty/requests" end onClick={onClose} className={({ isActive }) => subLinkClass(isActive)}>
                <Inbox className="w-3.5 h-3.5 flex-shrink-0" /> My Requests
              </NavLink>
            </div>
          )}
        </div>
      </nav>
      {userFooter}
    </aside>
  );
}
