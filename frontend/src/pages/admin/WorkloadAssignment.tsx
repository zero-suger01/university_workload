import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Search, X, Pencil, Trash2, Loader2, AlertTriangle, Tag, Download, ChevronDown, Plus, ClipboardList } from 'lucide-react';
import { PageHeader, FormHeader } from '../../components/shared/PageHeader';
import api from '../../api/client';
import { workloadsApi } from '../../api/workloads.api';
import StatusBadge from '../../components/shared/StatusBadge';
import { useAuthStore } from '../../store/authStore';
import * as XLSX from 'xlsx';
import { CustomDropdown } from '../../components/shared/CustomDropdown';


const schema = z.object({
  facultyId: z.string().optional().default(''),
  courseId: z.string().min(1),
  semesterId: z.string().optional().default(''),

  teachingLanguage: z.string().optional(),
  yearOfStudy: z.array(z.number()).min(0).default([]),
  semesterNumbers: z.array(z.number()).min(0).default([]),
  program: z.array(z.string()).min(0).default([]),
  courseCode: z.string().optional().default(''),
  courseTitle: z.string().min(1),
  courseType: z.enum(['optional', 'Requires', 'Both']).optional(),
  weekCount: z.coerce.number().min(0).default(0),
  courseECTS: z.coerce.number().min(0).default(0),
  semesterECTS: z.coerce.number().min(0).default(0),
  responsibleDepartment: z.string().optional().default(''),
  confirmedByResDept: z.boolean().default(false),
  studentCount: z.coerce.number().min(0).default(0),
  lectureGroup: z.coerce.number().min(0).default(0),
  tutorialGroup: z.coerce.number().min(0).default(0),
  totalSmallGroup: z.coerce.number().min(0).default(0),
  school: z.string().optional(),

  lectureHours: z.coerce.number().min(0),
  seminarHours: z.coerce.number().min(0),
  labHours: z.coerce.number().min(0),
  totalCoveredTutorialHours: z.coerce.number().min(0),
  totalCoveredLectureHours: z.coerce.number().min(0),
  totalCoveredLabHours: z.coerce.number().min(0),
  uncoveredHours: z.coerce.number(),
  lecturesAndTutorialsNo: z.coerce.number().int().min(0),
  assignedLectureHours: z.coerce.number().min(0),
  assignedTutorialHours: z.coerce.number().min(0),
});

type FormData = z.infer<typeof schema>;


// ─── Group Code selector component ───────────────────────────────────────────
interface GroupCodeSelectorProps {
  allCodes: string[];
  selected: string[];
  conflicts: { groupCode: string; faculty: { firstName: string; lastName: string } }[];
  onChange: (codes: string[]) => void;
  max?: number;
}

function GroupCodeSelector({ allCodes, selected, conflicts, onChange, max }: GroupCodeSelectorProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return term ? allCodes.filter((c) => c.toLowerCase().includes(term)) : allCodes;
  }, [allCodes, search]);

  const conflictMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of conflicts) m[c.groupCode] = `${c.faculty.firstName} ${c.faculty.lastName}`;
    return m;
  }, [conflicts]);

  function toggle(code: string) {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      if (max !== undefined && selected.length >= max) return;
      onChange([...selected, code]);
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Selected chips */}
      <div
        onClick={() => setOpen(true)}
        className="input min-h-[28px] h-7 flex flex-wrap gap-1 items-center cursor-text py-0.5 px-2"
      >
        {selected.length === 0 && (
          <span className="text-gray-400 text-[11px]">{max !== undefined && max > 0 ? `Select up to ${max}…` : 'Select…'}</span>
        )}
        {selected.map((code) => {
          const hasConflict = Boolean(conflictMap[code]);
          return (
            <span
              key={code}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                hasConflict
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-primary-100 text-primary-700'
              }`}
            >
              {code}
              {hasConflict && <AlertTriangle className="w-3 h-3" />}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggle(code); }}
                className="hover:text-red-600 ml-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          );
        })}
      </div>

      {/* Conflict warnings */}
      {conflicts.filter((c) => selected.includes(c.groupCode)).map((c) => (
        <p key={c.groupCode} className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span><strong>{c.groupCode}</strong> already assigned to {c.faculty.firstName} {c.faculty.lastName}</span>
        </p>
      ))}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search codes…"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          {max !== undefined && max > 0 && (
            <div className="px-3 py-1 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-500">Selected: <strong>{selected.length}</strong> / {max}</span>
              {selected.length >= max && <span className="text-[10px] text-amber-600 font-medium">Limit reached</span>}
            </div>
          )}
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">No codes found</p>
            ) : (
              filtered.map((code) => {
                const isSelected = selected.includes(code);
                const conflict = conflictMap[code];
                const isDisabled = !isSelected && max !== undefined && selected.length >= max;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggle(code)}
                    disabled={isDisabled}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 ${
                      isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
                    } ${isSelected ? 'bg-primary-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                      }`}>
                        {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                      </div>
                      <span className="font-medium">{code}</span>
                    </div>
                    {conflict && (
                      <span className="text-[10px] text-red-500 flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        {conflict}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WorkloadAssignment() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isHead = user?.role === 'DEPARTMENT_HEAD';

  const [search, setSearch] = useState('');
  // Department filter removed per user request — show all faculty always


  // Group codes state
  const [selectedGroupCodes, setSelectedGroupCodes] = useState<string[]>([]);
  // Tracks the responsible department chosen in the create form so matrixData can filter before watch() is available
  const [formResponsibleDept, setFormResponsibleDept] = useState('');
  // Locked after a successful assignment so table keeps showing the right dept even after form reset
  // Which table row is currently in "assign professor" mode (base workload id)
  const [assigningRowId, setAssigningRowId] = useState<string | null>(null);
  // Rejection reason popup: { profName, reason }
  const [rejectionPopup, setRejectionPopup] = useState<{ profName: string; reason: string } | null>(null);
  // Draft hours per professor while in assign mode: { [profId]: { l, t, la } }
  const [assignDraft, setAssignDraft] = useState<Record<string, { l: string; t: string; la: string }>>({});
  // Rows that have been sent to professors (show "Assigned" state)
  const [assignedRowIds, setAssignedRowIds] = useState<Set<string>>(new Set());

  // Selected course state for hour limits
  const [selectedCourse, setSelectedCourse] = useState<{
    weeklyLectureHours: number;
    weeklyTutorialHours: number;
    weeklyLabHours: number;
  } | null>(null);

  // Edit mode state — when set, the left panel is in edit mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBanner, setEditBanner] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'assign' | 'view' | 'recent'>('view');
  // showCreateForm removed — form now lives in Create/Assign tabs

  const [_facultySearch, setFacultySearch] = useState('');
  const [_showFacultyDropdown, setShowFacultyDropdown] = useState(false);
  const facultyRef = useRef<HTMLDivElement>(null);

  // View Workload filters
  const [viewSearch, setViewSearch] = useState('');
  const [viewFilterProgram, setViewFilterProgram] = useState('');
  const [viewFilterSemesterId, setViewFilterSemesterId] = useState('');
  const [viewFilterCourseType, setViewFilterCourseType] = useState('');
  const [viewFilterStatus, setViewFilterStatus] = useState('');

  // Recent Assignments filters
  const [recentFilterAssignedBy, setRecentFilterAssignedBy] = useState('');
  const [recentFilterDate, setRecentFilterDate] = useState('');

  // View Table modal
  // View Table modal removed — table is now always visible in View Workload tab

  // Inline editing state
  const [inlineEdit, setInlineEdit] = useState<{ id: string; field: string; value: string } | null>(null);
  // Ref always holds the latest inlineEdit — prevents stale-closure bugs in saveInlineEdit
  const inlineEditRef = useRef<{ id: string; field: string; value: string } | null>(null);
  useEffect(() => { inlineEditRef.current = inlineEdit; }, [inlineEdit]);
  // Live preview of formula fields while the user is typing (before save)
  const [previewRow, setPreviewRow] = useState<{ id: string; vals: Record<string, any> } | null>(null);

  // Multi-select / bulk-delete state
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const toggleCol = (key: string) => setHiddenCols(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  const col = (key: string) => !hiddenCols.has(key);
  const [matrixView] = useState(true);
  const [matrixHiddenCols, setMatrixHiddenCols] = useState<Set<number>>(new Set());
  const [hiddenDepts, setHiddenDepts] = useState<Set<string>>(new Set());
  const [showProfCols, setShowProfCols] = useState(true);
  const toggleMatrixCol = (i: number) => setMatrixHiddenCols(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });
  const toggleDept = (name: string) => setHiddenDepts(prev => { const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s; });
  const COL_LABELS: Record<string, string> = {
    lang: 'Language', yearOfStudy: 'Year of Study', semester: 'Semester', program: 'Program',
    courseCode: 'Course Code', courseTitle: 'Course Title', courseType: 'Course Type',
    courseDuration: 'Duration', courseECTS: 'Course ECTS', semesterECTS: 'Semester ECTS',
    resDept: 'Resp. Dept', confirmedResDept: 'Confirmed', students: 'Students',
    cohorts: 'Cohorts', smallGroups: 'Small Groups', totalSmallGroups: 'Total Groups',
    jointGroups: 'Joint Groups', lectureHours: 'Lec Hrs', tutorialHours: 'Tut Hrs',
    labHours: 'Lab Hrs', totalCovered: 'Covered', uncovered: 'Uncovered',
    lecTutNo: 'Lec & Tut Nº', staff: 'Academic Staff', status: 'Status', actions: 'Actions',
  };

  // ── Conflict check (debounced) ──
  const [conflictSemesterId, setConflictSemesterId] = useState('');
  const { data: groupCodeConflicts = [] } = useQuery({
    queryKey: ['group-code-conflicts', conflictSemesterId, selectedGroupCodes, editingId],
    queryFn: () =>
      workloadsApi.checkGroupCodeConflicts(
        conflictSemesterId,
        selectedGroupCodes,
        editingId ?? undefined,
      ),
    enabled: !!conflictSemesterId && selectedGroupCodes.length > 0,
    staleTime: 5_000,
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (facultyRef.current && !facultyRef.current.contains(e.target as Node)) {
        setShowFacultyDropdown(false);
      }
      // Close custom multi-select dropdowns
      const yosDropdown = document.getElementById('year-of-study-dropdown');
      const semDropdown = document.getElementById('semester-numbers-dropdown');
      const progDropdown = document.getElementById('program-dropdown');
      const target = e.target as Node;
      if (yosDropdown && !yosDropdown.contains(target) && !(target as Element)?.closest?.('[data-dropdown="year-of-study"]')) {
        yosDropdown.classList.add('hidden');
      }
      if (semDropdown && !semDropdown.contains(target) && !(target as Element)?.closest?.('[data-dropdown="semester-numbers"]')) {
        semDropdown.classList.add('hidden');
      }
      if (progDropdown && !progDropdown.contains(target) && !(target as Element)?.closest?.('[data-dropdown="program"]')) {
        progDropdown.classList.add('hidden');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const { data: users } = useQuery({
    queryKey: ['users-faculty'],
    queryFn: () => api.get('/users', { params: { limit: 200 } }).then((r) => r.data.data),
  });

  // For head: fetch own full profile to get facultyDepartment (responsible dept)
  const { data: headProfile } = useQuery({
    queryKey: ['head-profile', user?.id],
    queryFn: () => api.get(`/users/${user?.id}`).then((r) => r.data.data),
    enabled: isHead && !!user?.id,
  });
  const headFacultyDepartment: string = (headProfile as any)?.facultyDepartment || '';

  const { data: allCourses } = useQuery({
    queryKey: ['courses-all'],
    queryFn: () => api.get('/courses', { params: { limit: 200 } }).then((r) => r.data.data),
  });


  const { data: semesters } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => api.get('/semesters').then((r) => r.data.data),
  });

  const { data: allPrograms } = useQuery({
    queryKey: ['programs-list'],
    queryFn: () => api.get('/programs', { params: { limit: 200 } }).then((r) => r.data.data),
    staleTime: 60_000,
  });

  const { data: workloads } = useQuery({
    queryKey: ['workloads-all'],
    queryFn: () => workloadsApi.list({ limit: 100 }).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: availableGroupCodes = [] } = useQuery({
    queryKey: ['group-codes'],
    queryFn: workloadsApi.getGroupCodes,
    staleTime: 60_000,
  });



  // Recent tab filtered workloads

  // View tab filtered workloads with advanced filters
  const viewFilteredWorkloads = useMemo(() => {
    if (!workloads) return [];
    let result = [...workloads];

    if (viewSearch.trim()) {
      const term = viewSearch.toLowerCase().trim();
      result = result.filter((w: any) => {
        const facultyName = `${w.faculty?.firstName || ''} ${w.faculty?.lastName || ''}`.toLowerCase();
        const courseName = `${w.course?.courseCode || ''} ${w.course?.title || ''}`.toLowerCase();
        const program = (w.program || '').toLowerCase();
        const groupNums = (w.groupNumbers || '').toLowerCase();
        return facultyName.includes(term) || courseName.includes(term) || program.includes(term) || groupNums.includes(term);
      });
    }

    if (viewFilterProgram) {
      result = result.filter((w: any) => w.program?.split(',').map((p: string) => p.trim()).includes(viewFilterProgram));
    }
    if (viewFilterSemesterId) {
      result = result.filter((w: any) => w.semesterId === viewFilterSemesterId);
    }
    if (viewFilterCourseType) {
      result = result.filter((w: any) => w.courseType === viewFilterCourseType);
    }
    if (viewFilterStatus) {
      if (viewFilterStatus === 'OVERLOADED') result = result.filter((w: any) => w.isOverloaded);
      else if (viewFilterStatus === 'UNDERLOADED') result = result.filter((w: any) => w.isUnderloaded);
      else if (viewFilterStatus === 'NORMAL') result = result.filter((w: any) => !w.isOverloaded && !w.isUnderloaded);
    }

    return result;
  }, [workloads, viewSearch, viewFilterProgram, viewFilterSemesterId, viewFilterCourseType, viewFilterStatus]);

  // Matrix view: group workloads by planning key; professor columns from ALL academic staff
  const matrixData = useMemo(() => {
    if (!matrixView && activeTab !== 'assign') return null;

    // In assign tab: filter professors by facultyDepartment (their "Responsible Department")
    // which matches the workload's responsibleDepartment free-text field.
    // Fall back to showing all if no match found.
    let allowedDepts: Set<string> | null = null;
    if (activeTab === 'assign') {
      const fromWorkloads = new Set(
        (viewFilteredWorkloads as any[])
          .map((w: any) => (w.responsibleDepartment || '').toLowerCase().trim())
          .filter(Boolean)
      );
      const fromForm = formResponsibleDept.toLowerCase().trim();
      const candidates = fromWorkloads.size > 0 ? fromWorkloads : fromForm ? new Set([fromForm]) : null;

      if (isHead && headFacultyDepartment) {
        allowedDepts = new Set([headFacultyDepartment.toLowerCase().trim()]);
      } else if (candidates) {
        allowedDepts = candidates;
      } else {
        allowedDepts = new Set();
      }
    } else if (activeTab === 'view') {
      // In view tab: only show professors from departments that appear in visible workloads
      const fromWorkloads = new Set(
        (viewFilteredWorkloads as any[])
          .map((w: any) => (w.responsibleDepartment || '').toLowerCase().trim())
          .filter(Boolean)
      );
      if (isHead && headFacultyDepartment) {
        allowedDepts = new Set([headFacultyDepartment.toLowerCase().trim()]);
      } else if (fromWorkloads.size > 0) {
        allowedDepts = fromWorkloads;
      }
      // else allowedDepts stays null → show all (no workloads yet)
    }

    // Normalize "X Department" ↔ "Department of X" so slight name variations still match
    function normalizeDept(name: string): string {
      const s = name.toLowerCase().trim();
      if (s.startsWith('department of ')) return s;
      if (s.endsWith(' department')) return 'department of ' + s.slice(0, s.length - ' department'.length).trim();
      return s;
    }
    const normalizedAllowed = allowedDepts ? new Set(Array.from(allowedDepts).map(normalizeDept)) : null;

    // Build department → professor structure grouped by facultyDepartment
    const deptMap = new Map<string, { deptName: string; profs: { id: string; firstName: string; lastName: string }[] }>();
    for (const u of (users as any[] || [])) {
      // Use facultyDepartment as the grouping key (Responsible Department)
      const deptName = (u as any).facultyDepartment || u.department?.name || 'Other';
      if (normalizedAllowed && !normalizedAllowed.has(normalizeDept(deptName))) continue;
      if (!deptMap.has(deptName)) deptMap.set(deptName, { deptName, profs: [] });
      deptMap.get(deptName)!.profs.push({ id: u.id, firstName: u.firstName, lastName: u.lastName });
    }
    const depts = Array.from(deptMap.values()).filter(d => d.profs.length > 0);

    // View Workload tab: only show professor-confirmed (APPROVED) workloads
    // Assign Workload tab: show all (pending rows highlighted red)
    const sourceWorkloads = activeTab === 'view'
      ? viewFilteredWorkloads.filter((w: any) => w.approvalStatus === 'APPROVED')
      : viewFilteredWorkloads;

    // Group workloads by planning entry key (one row per unique course entry)
    const groups = new Map<string, any[]>();
    for (const w of sourceWorkloads) {
      const key = [
        w.teachingLanguage || '',
        (w.yearOfStudy || []).join('-'),
        (w.semesterNumbers || []).join('-'),
        w.program || '',
        w.courseId || '',
        (w.groupCodes || []).sort().join(','),
      ].join('||');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(w);
    }

    const rows = Array.from(groups.values()).sort((a, b) => {
      const aDate = new Date(a[0].createdAt || 0).getTime();
      const bDate = new Date(b[0].createdAt || 0).getTime();
      return aDate - bDate;
    }).map(assignments => {
      const base = assignments[0];
      const assignMap: Record<string, { id: string; l: number; t: number; lab: number; approvalStatus: string; rejectionReason?: string }> = {};
      for (const a of assignments) {
        assignMap[a.facultyId] = {
          id: a.id,
          l: (a as any).assignedLectureHours ?? 0,
          t: (a as any).assignedTutorialHours ?? 0,
          lab: (a as any).assignedLabHours ?? 0,
          approvalStatus: (a as any).approvalStatus ?? 'PENDING',
          rejectionReason: (a as any).rejectionReason ?? undefined,
        };
      }
      return { base, assignMap };
    });

    return { depts, rows };
  }, [matrixView, activeTab, viewFilteredWorkloads, users, formResponsibleDept]);

  // Excel download
  function downloadExcel() {
    if (!viewFilteredWorkloads.length) {
      toast.error('No data to download');
      return;
    }
    const rows = viewFilteredWorkloads.map((w: any) => ({
      'Language of Instruction': w.teachingLanguage?.replace('_', '-') || '',
      'Year of study': (w.yearOfStudy || []).join(', '),
      'Semester': (w.semesterNumbers || []).map((s: number) => `Semester ${s}`).join(', '),
      'Program': w.program || '',
      'Course code': w.course?.courseCode || '',
      'Course title': w.course?.title || '',
      'Course Type': COURSE_TYPE_LABEL[w.courseType || ''] || w.courseType || '',
      'Course duration': w.weekCount ? `${w.weekCount} week` : '',
      'Course ECTS': w.courseECTS || '',
      'Semester ECTS': w.semesterECTS || '',
      'Responsible Department': w.responsibleDepartment || '',
      'Course Duration': w.school || '',
      'Confirmed to make schedule by res. dept': w.confirmedByResDept ? 'True' : 'False',
      'Number of students': w.studentCount || '',
      'Groups numbers': w.groupNumbers || '',
      'Total number of groups': w.totalNumberOfGroups || '',
      'Lecture groups': w.lectureGroup || '',
      'Tutorial Groups': w.tutorialGroup || '',
      'Total Small Groups': (w as any).totalSmallGroup || '',
      'Lecture hours': w.lectureHours || 0,
      'Tutorial hours': w.seminarHours || 0,
      'lab hours': w.labHours || 0,
      'Total covered tutorial hours per week': w.totalCoveredTutorialHours || 0,
      'Total covered lecture hours per week': w.totalCoveredLectureHours || 0,
      'Total covered lab hours per week': (w as any).totalCoveredLabHours || 0,
      'uncovered hours': w.uncoveredHours || 0,
      'Lectures and tutorials nº': w.lecturesAndTutorialsNo || 0,
      'Academic Staff': `${w.faculty?.firstName || ''} ${w.faculty?.lastName || ''}`,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Workloads');
    XLSX.writeFile(wb, `workloads_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Excel downloaded');
  }

  const { register, handleSubmit, reset, watch, setValue, formState: { errors: _errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    shouldUnregister: false,
    defaultValues: {
      teachingLanguage: undefined,
      yearOfStudy: [],
      semesterNumbers: [],
      program: [],
      courseCode: '',
      courseTitle: '',
      courseType: undefined,
      weekCount: 16,
      courseECTS: 0,
      semesterECTS: 0,
      responsibleDepartment: '',
      confirmedByResDept: false,
      lectureGroup: 0,
      tutorialGroup: 0,
      totalSmallGroup: 0,
      school: '',
      studentCount: 0,
      lectureHours: 0, seminarHours: 0, labHours: 0,
      totalCoveredTutorialHours: 0,
      totalCoveredLectureHours: 0,
      totalCoveredLabHours: 0,
      uncoveredHours: 0,
      lecturesAndTutorialsNo: 0,
      assignedLectureHours: 0,
      assignedTutorialHours: 0,
    },
  });

  const values = watch();
  const totalHours =
    Number(values.lectureHours) + Number(values.seminarHours) + Number(values.labHours);


  // Auto-select semesterId from the first available semester when loaded
  useEffect(() => {
    if (semesters?.length) {
      const current = semesters.find((s: any) => s.isCurrent) ?? semesters[0];
      if (!watch('semesterId')) {
        setValue('semesterId', current.id, { shouldValidate: false });
        setConflictSemesterId(current.id);
      }
      // Auto-apply semester filter in View tab so table only shows one semester
      if (!viewFilterSemesterId) {
        setViewFilterSemesterId(current.id);
      }
    }
  }, [semesters]);

  // Keep conflict check in sync with selected semester
  useEffect(() => {
    if (values.semesterId) setConflictSemesterId(values.semesterId);
  }, [values.semesterId]);

  // Sync responsible department into state so matrixData can filter professors
  useEffect(() => {
    setFormResponsibleDept(values.responsibleDepartment || '');
  }, [values.responsibleDepartment]);



  // ── Course assignments summary (when course + semester selected) ──
  const selectedCourseId = watch('courseId');
  const selectedSemesterId = watch('semesterId');

  // Semester ECTS sum per program block (matches Excel =SUM(I5:I9))
  const semesterEctsSum = useMemo(() => {
    if (!workloads || !selectedSemesterId || !values.program?.length) return 0;
    const currentProgram = values.program.join(', ');
    return workloads
      .filter((w: any) => w.semesterId === selectedSemesterId && w.program === currentProgram)
      .reduce((sum: number, w: any) => sum + (w.courseECTS || 0), 0);
  }, [workloads, selectedSemesterId, values.program]);

  const { data: courseAssignments } = useQuery({
    queryKey: ['course-assignments', selectedCourseId, selectedSemesterId],
    queryFn: () =>
      workloadsApi.getCourseAssignments(selectedCourseId!, selectedSemesterId!),
    enabled: !!selectedCourseId && !!selectedSemesterId,
    staleTime: 5_000,
  });

  // Auto-fill hours from catalog × group counts  (Excel: S=lec×N, T=tut×O, U=lab×O)
  useEffect(() => {
    if (selectedCourse) {
      const lectureGrp = Number(values.lectureGroup)  || 0;
      const tutorialGrp = Number(values.tutorialGroup) || 0;
      setValue('lectureHours', (selectedCourse.weeklyLectureHours  || 0) * lectureGrp,  { shouldValidate: false });
      setValue('seminarHours', (selectedCourse.weeklyTutorialHours || 0) * tutorialGrp, { shouldValidate: false });
      setValue('labHours',     (selectedCourse.weeklyLabHours      || 0) * tutorialGrp, { shouldValidate: false });
    }
  }, [selectedCourse, values.lectureGroup, values.tutorialGroup, setValue]);

  // Keep lecturesAndTutorialsNo = S + T + U  (Excel: X = SUM(S:U))
  useEffect(() => {
    setValue('lecturesAndTutorialsNo', Math.round(totalHours * 10) / 10, { shouldValidate: false });
  }, [totalHours, setValue]);

  // Semester ECTS = SUM of all course ECTS in same program+semester block  (Excel: J = SUM(I5:I9))
  // semesterEctsSum sums existing records; add the current course's ECTS for the full block total
  useEffect(() => {
    const currentCourseEcts = Number(values.courseECTS) || 0;
    // Only count current course if it's a new workload (no editingId) — editing already in sum
    const blockTotal = semesterEctsSum + (editingId ? 0 : currentCourseEcts);
    if (blockTotal > 0) {
      setValue('semesterECTS', blockTotal, { shouldValidate: false });
    }
  }, [semesterEctsSum, values.courseECTS, editingId, setValue]);

  // Sync covered fields and compute uncovered  (Excel: W = V − X)
  useEffect(() => {
    if (selectedCourse && courseAssignments) {
      const cov = courseAssignments.covered;
      setValue('totalCoveredLectureHours', cov.lecture, { shouldValidate: false });
      setValue('totalCoveredTutorialHours', cov.tutorial, { shouldValidate: false });
      setValue('totalCoveredLabHours', cov.lab, { shouldValidate: false });
      // X = S + T + U = catalog × groups (already set by the hours effect above)
      const lectureGrp  = Number(values.lectureGroup)  || 0;
      const tutorialGrp = Number(values.tutorialGroup) || 0;
      const required =
        (selectedCourse.weeklyLectureHours  || 0) * lectureGrp
        + (selectedCourse.weeklyTutorialHours || 0) * tutorialGrp
        + (selectedCourse.weeklyLabHours      || 0) * tutorialGrp;
      setValue('uncoveredHours', cov.total - required, { shouldValidate: false });
    }
  }, [selectedCourse, courseAssignments, values.lectureGroup, values.tutorialGroup, setValue]);

  function resetForm() {
    reset({
      facultyId: '', courseId: '', semesterId: '',
      teachingLanguage: undefined,
      yearOfStudy: [],
      semesterNumbers: [],
      program: [],
      courseCode: '',
      courseTitle: '',
      courseType: undefined,
      weekCount: 16,
      courseECTS: 0,
      semesterECTS: 0,
      responsibleDepartment: '',
      confirmedByResDept: false,
      lectureGroup: 0,
      tutorialGroup: 0,
      totalSmallGroup: 0,
      school: '',
      lectureHours: 0, seminarHours: 0, labHours: 0,
      totalCoveredTutorialHours: 0,
      totalCoveredLectureHours: 0,
      totalCoveredLabHours: 0,
      uncoveredHours: 0,
      lecturesAndTutorialsNo: 0,
      assignedLectureHours: 0,
      assignedTutorialHours: 0,
    });
    setFacultySearch('');
    setSelectedGroupCodes([]);
    setSelectedCourse(null);
    setEditingId(null);
    setEditBanner('');
    setConflictSemesterId('');
  }

  const assign = useMutation({
    mutationFn: (data: FormData) =>
      workloadsApi.create({ ...data, groupCodes: selectedGroupCodes, program: data.program.join(', ') }),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: ['workloads-all'] });
      qc.invalidateQueries({ queryKey: ['faculty-workloads'] });
      const dept = variables.responsibleDepartment || '';
      setFormResponsibleDept(dept);
      setShowProfCols(true);
      resetForm();
      setActiveTab('assign');
      toast.success('Workload created — now assign professors');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      const msg = e?.response?.data?.message ?? t('failedToAssign');
      toast.error(msg, { duration: 5000 });
    },
  });

  const updateWorkload = useMutation({
    mutationFn: (data: FormData) =>
      workloadsApi.update(editingId!, { ...data, groupCodes: selectedGroupCodes, program: data.program.join(', ') }),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: ['workloads-all'] });
      qc.invalidateQueries({ queryKey: ['faculty-workloads'] });
      const dept = variables.responsibleDepartment || '';
      setFormResponsibleDept(dept);
      setShowProfCols(true);
      resetForm();
      setActiveTab('assign');
      toast.success('Workload updated');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      const msg = e?.response?.data?.message ?? t('failedToAssign');
      toast.error(msg, { duration: 5000 });
    },
  });

  const isPending = assign.isPending || updateWorkload.isPending;

  // ── Inline-edit: patch a single row and auto-compute formula fields ──────────
  const quickPatch = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      workloadsApi.update(id, patch),
    onMutate: ({ id, patch }) => {
      // Optimistic update — immediately reflect change in cache so cell shows new value
      qc.setQueryData(['workloads-all'], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((w: any) => w.id === id ? { ...w, ...patch } : w);
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workloads-all'] }),
    onError: (err: any) => {
      qc.invalidateQueries({ queryKey: ['workloads-all'] }); // revert optimistic update
      toast.error(err?.response?.data?.message || 'Failed to save');
    },
  });

  // Batch-send all draft hours for the assigning row to professors
  async function submitBatchAssign(rowBase: any, draft: Record<string, { l: string; t: string; la: string }>, assignMap: Record<string, { id: string; l: number; t: number; lab: number }>) {
    const entries = Object.entries(draft);
    if (entries.length === 0) { toast.error('Enter hours for at least one professor'); return; }
    try {
      await Promise.all(entries.map(([profId, { l, t, la }]) => {
        const lNum = Number(l) || 0;
        const tNum = Number(t) || 0;
        const laNum = Number(la) || 0;
        const existing = assignMap[profId];
        if (existing) {
          return workloadsApi.update(existing.id, { assignedLectureHours: lNum, assignedTutorialHours: tNum, assignedLabHours: laNum });
        }
        return workloadsApi.create({
          facultyId: profId,
          courseId: rowBase.courseId,
          semesterId: rowBase.semesterId,
          teachingLanguage: rowBase.teachingLanguage,
          yearOfStudy: rowBase.yearOfStudy ?? [],
          semesterNumbers: rowBase.semesterNumbers ?? [],
          program: rowBase.program ?? '',
          courseCode: rowBase.courseCode ?? '',
          courseTitle: rowBase.courseTitle ?? '',
          courseType: rowBase.courseType,
          courseECTS: rowBase.courseECTS ?? 0,
          semesterECTS: rowBase.semesterECTS ?? 0,
          responsibleDepartment: rowBase.responsibleDepartment ?? '',
          confirmedByResDept: rowBase.confirmedByResDept ?? false,
          studentCount: rowBase.studentCount ?? 0,
          lectureGroup: rowBase.lectureGroup ?? 0,
          tutorialGroup: rowBase.tutorialGroup ?? 0,
          totalSmallGroup: rowBase.totalSmallGroup ?? 0,
          school: rowBase.school,
          groupCodes: rowBase.groupCodes ?? [],
          lectureHours: rowBase.lectureHours ?? 0,
          seminarHours: rowBase.seminarHours ?? 0,
          labHours: rowBase.labHours ?? 0,
          lecturesAndTutorialsNo: rowBase.lecturesAndTutorialsNo ?? 0,
          assignedLectureHours: lNum,
          assignedTutorialHours: tNum,
          assignedLabHours: laNum,
        });
      }));
      await qc.invalidateQueries({ queryKey: ['workloads-all'] });
      setAssignedRowIds(prev => new Set([...prev, rowBase.id]));
      setAssigningRowId(null);
      setAssignDraft({});
      toast.success('Assigned and sent to professors');
      setTimeout(() => setAssignedRowIds(prev => { const next = new Set(prev); next.delete(rowBase.id); return next; }), 2000);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign');
    }
  }

  const NUMERIC_FIELDS = new Set([
    'lectureGroup','tutorialGroup','studentCount','weekCount','semesterECTS',
    'totalCoveredLectureHours','totalCoveredTutorialHours','totalCoveredLabHours','totalNumberOfGroups',
    'lectureHours','seminarHours','labHours','uncoveredHours','lecturesAndTutorialsNo',
    'assignedLectureHours','assignedTutorialHours','assignedLabHours',
  ]);

  function computeFormulaFields(field: string, rawVal: any, row: any): Record<string, unknown> {
    const val = NUMERIC_FIELDS.has(field) ? Number(rawVal) : rawVal;
    const patch: Record<string, unknown> = { [field]: val };

    // New assigned-hours fields — no formula cascade needed; backend resyncs covered/uncovered
    if (field === 'assignedLectureHours' || field === 'assignedTutorialHours' || field === 'assignedLabHours') {
      return { [field]: Number(rawVal) };
    }

    const courses = allCourses as any[] | undefined;

    // Course title change → cascade to code, ECTS, dept, all hour formulas
    // Excel: E=VLOOKUP(F,catalog,2), I=VLOOKUP(F,catalog,9), K=INDEX(dept,MATCH(code,C,0))
    // Excel: S=lec×N, T=tut×O, U=lab×O, J=SUM block ECTS
    if (field === 'courseTitle') {
      const course = courses?.find((c: any) => c.title === rawVal);
      if (course) {
        patch.courseId = course.id;
        const newEcts = course.ectsCredits ?? 0;
        patch.courseECTS = newEcts;
        patch.responsibleDepartment = (course as any).responsibleDepartment || course.department?.name || '';
        // J = SUM of block ECTS: siblings in same program+semester + new course ECTS
        const siblings = (workloads as any[] | undefined)?.filter(
          (w: any) => w.semesterId === row.semesterId && w.program === row.program && w.id !== row.id
        ) ?? [];
        const blockEcts = siblings.reduce((s: number, w: any) => s + (w.courseECTS || 0), 0) + newEcts;
        if (blockEcts > 0) patch.semesterECTS = blockEcts;
        const lectureGrp  = row.lectureGroup  ?? 0;
        const tutorialGrp = row.tutorialGroup ?? 0;
        const lecH = (course.weeklyLectureHours  ?? 0) * lectureGrp;
        const tutH = (course.weeklyTutorialHours ?? 0) * tutorialGrp;
        const labH = (course.weeklyLabHours      ?? 0) * tutorialGrp;
        patch.lectureHours = lecH; patch.seminarHours = tutH; patch.labHours = labH;
        const latNo = lecH + tutH + labH;
        patch.lecturesAndTutorialsNo = Math.round(latNo * 10) / 10;
        const covTotal = (row.totalCoveredLectureHours ?? 0) + (row.totalCoveredTutorialHours ?? 0) + (row.totalCoveredLabHours ?? 0);
        patch.uncoveredHours = covTotal - latNo;
      }
      return patch;
    }

    const course = courses?.find((c: any) => c.id === row.courseId || c.courseCode === row.course?.courseCode);
    const covLec   = field === 'totalCoveredLectureHours'  ? Number(val) : (row.totalCoveredLectureHours  ?? 0);
    const covTut   = field === 'totalCoveredTutorialHours' ? Number(val) : (row.totalCoveredTutorialHours ?? 0);
    const covLab   = field === 'totalCoveredLabHours'      ? Number(val) : (row.totalCoveredLabHours      ?? 0);

    let lecH = row.lectureHours ?? 0;
    let tutH = row.seminarHours ?? 0;
    let labH = row.labHours ?? 0;

    // lectureGroup change: lectureHours = catalog_lec × new_lectureGroup (Excel: S = VLOOKUP×N)
    if (field === 'lectureGroup' && course) {
      lecH = (course.weeklyLectureHours ?? 0) * Number(val);
      patch.lectureHours = lecH;
    }
    // tutorialGroup change: tutorialHours = catalog_tut × new_tutorialGroup, labHours = catalog_lab × new_tutorialGroup
    // (Excel: T = VLOOKUP×O, U = VLOOKUP×O)
    if (field === 'tutorialGroup' && course) {
      tutH = (course.weeklyTutorialHours ?? 0) * Number(val);
      labH = (course.weeklyLabHours      ?? 0) * Number(val);
      patch.seminarHours = tutH; patch.labHours = labH;
    }

    // Direct edits to hour fields → recompute Lec+Tut+Lab # and Uncovered
    if (field === 'lectureHours') lecH = Number(val);
    if (field === 'seminarHours') tutH = Number(val);
    if (field === 'labHours')     labH = Number(val);

    if (['lectureGroup','tutorialGroup','lectureHours','seminarHours','labHours'].includes(field)) {
      // Excel X = SUM(S:U), W = V - X
      const latNo = lecH + tutH + labH;
      patch.lecturesAndTutorialsNo = Math.round(latNo * 10) / 10;
      patch.uncoveredHours = (covLec + covTut + covLab) - latNo;
    }

    // Direct edit to Lec+Tut+Lab # → recompute Uncovered
    if (field === 'lecturesAndTutorialsNo') {
      patch.uncoveredHours = (covLec + covTut + covLab) - Number(val);
    }

    // Direct edits to covered hours → recompute Uncovered
    if (['totalCoveredLectureHours','totalCoveredTutorialHours','totalCoveredLabHours'].includes(field)) {
      patch.uncoveredHours = (covLec + covTut + covLab) - (row.lecturesAndTutorialsNo ?? 0);
    }
    return patch;
  }

  function saveInlineEdit() {
    // Always read from ref to get the latest value — avoids stale closure
    const edit = inlineEditRef.current;
    if (!edit) return;
    const { id, field, value } = edit;
    const row = (workloads as any[] | undefined)?.find((w: any) => w.id === id);
    setPreviewRow(null);
    setInlineEdit(null);
    if (!row) return;
    if (value === String(row[field] ?? '')) return; // no change
    const patch = computeFormulaFields(field, value, row);
    quickPatch.mutate({ id, patch });
  }

  function cancelInlineEdit() {
    setPreviewRow(null);
    setInlineEdit(null);
  }

  function openEdit(w: {
    id: string;
    facultyId: string;
    courseId: string;
    semesterId: string;
    lectureHours: number; seminarHours: number; labHours: number;
    groupCodes?: string[];
    faculty: { firstName: string; lastName: string };
    course: { courseCode: string; title: string };
    semester?: { name: string };
    teachingLanguage?: string | null;
    yearOfStudy?: number[] | null;
    semesterNumbers?: number[] | null;
    program?: string | null;
    courseType?: string | null;
    weekCount?: number | null;
    courseECTS?: number | null;
    semesterECTS?: number | null;
    responsibleDepartment?: string | null;
    confirmedByResDept?: boolean | null;
    studentCount?: number | null;
    groupNumbers?: string | null;
    totalNumberOfGroups?: number | null;
    lectureGroup?: number | null;
    tutorialGroup?: number | null;
    totalCoveredTutorialHours?: number | null;
    totalCoveredLectureHours?: number | null;
    uncoveredHours?: number | null;
    lecturesAndTutorialsNo?: number | null;
  }) {
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setEditingId(w.id);
    setEditBanner(`${w.faculty.firstName} ${w.faculty.lastName} — ${w.course.courseCode} ${w.course.title}`);

    const facultyUser = (users as { id: string; departmentId?: string }[] | undefined)?.find(
      (u) => u.id === w.facultyId
    );
    if (facultyUser?.departmentId) {
      // Department filter removed — no action needed
    }

    setValue('facultyId', w.facultyId, { shouldValidate: false });
    setValue('courseId', w.courseId, { shouldValidate: false });
    setValue('semesterId', w.semesterId, { shouldValidate: false });
    setValue('lectureHours', w.lectureHours, { shouldValidate: false });
    setValue('seminarHours', w.seminarHours, { shouldValidate: false });
    setValue('labHours', w.labHours, { shouldValidate: false });

    // New fields with fallbacks
    setValue('teachingLanguage', w.teachingLanguage ?? undefined, { shouldValidate: false });
    setValue('yearOfStudy', w.yearOfStudy ?? [], { shouldValidate: false });
    setValue('semesterNumbers', w.semesterNumbers ?? [], { shouldValidate: false });
    setValue('program', w.program ? w.program.split(',').map(p => p.trim()).filter(Boolean) : [], { shouldValidate: false });
    setValue('courseCode', w.course.courseCode ?? '', { shouldValidate: false });
    setValue('courseTitle', w.course.title ?? '', { shouldValidate: false });
    setValue('courseType', (w.courseType as 'optional' | 'Requires' | undefined) ?? undefined, { shouldValidate: false });
    setValue('weekCount', w.weekCount ?? 16, { shouldValidate: false });
    setValue('courseECTS', w.courseECTS ?? 0, { shouldValidate: false });
    setValue('semesterECTS', w.semesterECTS ?? 0, { shouldValidate: false });
    setValue('responsibleDepartment', w.responsibleDepartment ?? '', { shouldValidate: false });
    setValue('confirmedByResDept', w.confirmedByResDept ?? false, { shouldValidate: false });
    setValue('school', (w as any).school ?? '', { shouldValidate: false });
    setValue('lectureGroup', w.lectureGroup ?? 0, { shouldValidate: false });
    setValue('tutorialGroup', w.tutorialGroup ?? 0, { shouldValidate: false });
    setValue('totalSmallGroup', (w as any).totalSmallGroup ?? 0, { shouldValidate: false });
    setValue('studentCount', w.studentCount ?? 0, { shouldValidate: false });
    setValue('totalCoveredTutorialHours', w.totalCoveredTutorialHours ?? 0, { shouldValidate: false });
    setValue('totalCoveredLectureHours', w.totalCoveredLectureHours ?? 0, { shouldValidate: false });
    setValue('totalCoveredLabHours', (w as any).totalCoveredLabHours ?? 0, { shouldValidate: false });
    setValue('uncoveredHours', w.uncoveredHours ?? 0, { shouldValidate: false });
    setValue('lecturesAndTutorialsNo', w.lecturesAndTutorialsNo ?? 0, { shouldValidate: false });
    setValue('assignedLectureHours', (w as any).assignedLectureHours ?? 0, { shouldValidate: false });
    setValue('assignedTutorialHours', (w as any).assignedTutorialHours ?? 0, { shouldValidate: false });

    setFacultySearch(`${w.faculty.firstName} ${w.faculty.lastName}`);
    setSelectedGroupCodes(w.groupCodes ?? []);

    const editedCourse = (allCourses as any[] | undefined)?.find((c: any) => c.id === w.courseId);
    if (editedCourse) {
      setSelectedCourse({
        weeklyLectureHours: editedCourse.weeklyLectureHours ?? 0,
        weeklyTutorialHours: editedCourse.weeklyTutorialHours ?? 0,
        weeklyLabHours: editedCourse.weeklyLabHours ?? 0,
      });
    }

    setConflictSemesterId(w.semesterId);
  }

  function enterSelectMode(id: string) {
    setShowCheckboxes(true);
    setSelectedIds(new Set([id]));
  }
  function cancelSelectMode() {
    setShowCheckboxes(false);
    setSelectedIds(new Set());
  }
  function toggleSelect(id: string) {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function toggleSelectAll(rows: any[]) {
    const ids = rows.map((r) => r.id);
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }
  function handleBulkDelete() {
    if (!window.confirm(`Delete ${selectedIds.size} workload assignment(s)? This cannot be undone.`)) return;
    setBulkPending(true);
    const count = selectedIds.size;
    Promise.all(Array.from(selectedIds).map((id) => {
      if (editingId === id) resetForm();
      return workloadsApi.delete(id);
    }))
      .then(() => { qc.invalidateQueries({ queryKey: ['workloads-all'] }); qc.invalidateQueries({ queryKey: ['faculty-workloads'] }); toast.success(`${count} assignments deleted`); cancelSelectMode(); })
      .catch((err: any) => toast.error(err?.response?.data?.message || 'Failed to delete'))
      .finally(() => setBulkPending(false));
  }

  function onSubmit(data: FormData) {
    if (editingId) {
      updateWorkload.mutate(data);
    } else {
      assign.mutate(data);
    }
  }

  const COURSE_TYPE_LABEL: Record<string, string> = { optional: 'Optional', Requires: 'Required', Both: 'Both' };

  // ── Reusable workload form JSX ───────────────────────────────────────────────
  const workloadForm = (mode: 'create' | 'assign') => (
    <div className="card">
      <FormHeader
        title={editingId ? `${t('edit')} Workload` : mode === 'create' ? 'Create Workload' : 'Assign Workload'}
        subtitle={editingId ? editBanner : mode === 'create' ? 'Enter course and group information' : 'Enter hours and assign faculty'}
        onClose={editingId ? resetForm : undefined}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {mode === 'create' && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-5">

          {/* Row 1: Language, Year of Study, Semester (1-8 multi), Program, Course Code, Course Title */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* Language */}
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Language <span className="text-red-400">*</span></label>
              <CustomDropdown
                value={watch('teachingLanguage') || ''}
                options={[
                  { value: 'UZB', label: 'UZB' },
                  { value: 'UZB_ENG', label: 'UZB-ENG' },
                  { value: 'RUS_ENG', label: 'RUS-ENG' },
                ]}
                onChange={(val) => setValue('teachingLanguage', val || undefined, { shouldValidate: true })}
                placeholder="Select"
                className="mt-[1px]"
              />
            </div>
            {/* Year of Study */}
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Year of Study <span className="text-red-400">*</span></label>
              <div className="relative">
                <button type="button" data-dropdown="year-of-study" onClick={() => { const el = document.getElementById('year-of-study-dropdown'); if (el) el.classList.toggle('hidden'); }} className="input w-full text-left flex items-center justify-between py-1 text-[11px] h-7 mt-[1px]">
                  <span className={watch('yearOfStudy')?.length ? 'text-gray-900' : 'text-gray-400'}>{watch('yearOfStudy')?.length ? watch('yearOfStudy').sort((a: number, b: number) => a - b).join(', ') : 'Select'}</span>
                  <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                </button>
                <div id="year-of-study-dropdown" className="hidden absolute z-20 mt-0.5 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {[1,2,3,4].map((year) => {
                    const selected = (watch('yearOfStudy') || []).includes(year);
                    return (<label key={year} className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={selected} onChange={() => { const current = watch('yearOfStudy') || []; setValue('yearOfStudy', current.includes(year) ? current.filter((y: number) => y !== year) : [...current, year], { shouldValidate: true }); }} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="text-[11px]">Year {year}</span>
                    </label>);
                  })}
                </div>
              </div>
            </div>
            {/* Semester (multi-select 1-8) */}
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Semester</label>
              <div className="relative">
                <button type="button" data-dropdown="semester-numbers" onClick={() => { const el = document.getElementById('semester-numbers-dropdown'); if (el) el.classList.toggle('hidden'); }} className="input w-full text-left flex items-center justify-between py-1 text-[11px] h-7 mt-[1px]">
                  <span className={watch('semesterNumbers')?.length ? 'text-gray-900' : 'text-gray-400'}>
                    {watch('semesterNumbers')?.length
                      ? watch('semesterNumbers').sort((a: number, b: number) => a - b).map((s: number) => `Sem ${s}`).join(', ')
                      : 'Select'}
                  </span>
                  <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                </button>
                <div id="semester-numbers-dropdown" className="hidden absolute z-20 mt-0.5 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {[1,2,3,4,5,6,7,8].map((sem) => {
                    const selected = (watch('semesterNumbers') || []).includes(sem);
                    return (<label key={sem} className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={selected} onChange={() => { const current = watch('semesterNumbers') || []; setValue('semesterNumbers', current.includes(sem) ? current.filter((s: number) => s !== sem) : [...current, sem], { shouldValidate: true }); }} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="text-[11px]">Semester {sem}</span>
                    </label>);
                  })}
                </div>
              </div>
              <input type="hidden" {...register('semesterId')} />
            </div>
            {/* Program */}
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Program <span className="text-red-400">*</span></label>
              <div className="relative">
                <button type="button" data-dropdown="program" onClick={() => { const el = document.getElementById('program-dropdown'); if (el) el.classList.toggle('hidden'); }} className="input w-full text-left flex items-center justify-between py-1 text-[11px] h-7 mt-[1px]">
                  <span className={watch('program')?.length ? 'text-gray-900 truncate' : 'text-gray-400'}>
                    {(() => {
                      const sel = watch('program') || [];
                      if (!sel.length) return 'Select';
                      if (sel.length === 9) return 'All Programs';
                      if (sel.length > 2) return `${sel.length} programs selected`;
                      return sel.join(', ');
                    })()}
                  </span>
                  <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                </button>
                <div id="program-dropdown" className="hidden absolute z-20 mt-0.5 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {(() => {
                    const programNames = (allPrograms ?? []).map((p: any) => p.name).sort();
                    const current = watch('program') || [];
                    const allSelected = programNames.length > 0 && programNames.every((p: string) => current.includes(p));
                    return (<>
                      <label className="flex items-center gap-1.5 px-2 py-1 hover:bg-primary-50 cursor-pointer border-b border-gray-100">
                        <input type="checkbox" checked={allSelected} onChange={() => setValue('program', allSelected ? [] : [...programNames], { shouldValidate: true })} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        <span className="text-[11px] font-semibold text-primary-700">Choose All</span>
                      </label>
                      {programNames.map((prog: string) => {
                        const selected = current.includes(prog);
                        return (<label key={prog} className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" checked={selected} onChange={() => { const c = watch('program') || []; setValue('program', selected ? c.filter((p: string) => p !== prog) : [...c, prog], { shouldValidate: true }); }} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                          <span className="text-[11px]">{prog}</span>
                        </label>);
                      })}
                    </>);
                  })()}
                </div>
              </div>
            </div>
            {/* Course Title */}
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Course Title <span className="text-red-400">*</span></label>
              <CustomDropdown
                value={watch('courseTitle') || ''}
                options={(allCourses || []).map((c: { id: string; title: string }) => ({ value: c.title, label: c.title }))}
                onChange={(val) => {
                  const title = val;
                  const course = (allCourses || []).find((c: { title: string; courseCode: string; id: string; ectsCredits?: number; department?: { name?: string }; weeklyLectureHours?: number; weeklyTutorialHours?: number; weeklyLabHours?: number }) => c.title === title);
                  setValue('courseTitle', title, { shouldValidate: true });
                  setValue('courseCode', course?.courseCode || '', { shouldValidate: true });
                  setValue('courseId', course?.id || '', { shouldValidate: true });
                  if (course) {
                    const c = course as any;
                    setSelectedCourse({ weeklyLectureHours: c.weeklyLectureHours ?? 0, weeklyTutorialHours: c.weeklyTutorialHours ?? 0, weeklyLabHours: c.weeklyLabHours ?? 0 });
                    setValue('courseECTS', c.ectsCredits ?? 0, { shouldValidate: false });
                    setValue('responsibleDepartment', (c as any).responsibleDepartment || c.department?.name || '', { shouldValidate: false });
                    setValue('lectureHours', (c.weeklyLectureHours ?? 0), { shouldValidate: false });
                    setValue('seminarHours', (c.weeklyTutorialHours ?? 0), { shouldValidate: false });
                    setValue('labHours', (c.weeklyLabHours ?? 0), { shouldValidate: false });
                  } else {
                    setSelectedCourse(null);
                    setValue('courseECTS', 0, { shouldValidate: false });
                    setValue('responsibleDepartment', '', { shouldValidate: false });
                  }
                }}
                placeholder="Select"
                className="mt-[1px]"
              />
              <input type="hidden" {...register('courseId')} />
            </div>
            {/* Course Code (auto-filled) */}
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Course Code</label>
              <div className="bg-gray-100 text-gray-600 text-[11px] flex items-center h-7 px-2 rounded-md border border-gray-200 mt-[1px] truncate">{watch('courseCode') || <span className="text-gray-400">Auto-filled</span>}</div>
            </div>
          </div>

          {/* Row 2: Course Type + Course ECTS + Semester ECTS + Responsible Department + Confirmed by res. dept. + Number of students */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-2 gap-y-5">
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Course Type</label>
              <CustomDropdown
                value={watch('courseType') || ''}
                options={[
                  { value: 'optional', label: 'Optional' },
                  { value: 'Requires', label: 'Required' },
                  { value: 'Both', label: 'Both' },
                ]}
                onChange={(val) => setValue('courseType', val ? val as 'optional' | 'Requires' | 'Both' : undefined, { shouldValidate: true })}
                placeholder="Select"
                className="mt-[1px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Course Duration</label>
              <CustomDropdown
                value={watch('school') || ''}
                options={[
                  { value: '4 weeks', label: '4 weeks' },
                  { value: '8 weeks', label: '8 weeks' },
                  { value: '12 weeks', label: '12 weeks' },
                  { value: '16 weeks', label: '16 weeks' },
                ]}
                onChange={(val) => setValue('school', val || undefined, { shouldValidate: true })}
                placeholder="Select"
                className="mt-[1px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Course ECTS <span className="text-red-400">*</span></label>
              <div className="bg-gray-100 text-gray-600 text-[11px] flex items-center h-7 px-2 rounded-md border border-gray-200 mt-[1px]">{watch('courseECTS') ?? <span className="text-gray-400">Auto</span>}</div>
              <input type="hidden" {...register('courseECTS')} />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Semester ECTS <span className="text-red-400">*</span></label>
              <input type="number" step="0.1" min="0" {...register('semesterECTS')} className="input py-1 text-[11px] h-7 mt-[1px]" placeholder="0" />
              {semesterEctsSum > 0 && (<p className="text-[8px] text-gray-400 mt-0 leading-none">Block: <strong>{semesterEctsSum.toFixed(1)}</strong></p>)}
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Responsible Department <span className="text-red-400">*</span></label>
              <div className="bg-gray-100 text-gray-600 text-[11px] flex items-center h-7 px-2 rounded-md border border-gray-200 mt-[1px] truncate">{watch('responsibleDepartment') || <span className="text-gray-400">Auto</span>}</div>
              <input type="hidden" {...register('responsibleDepartment')} />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Confirmed by res. dept.</label>
              <CustomDropdown
                value={watch('confirmedByResDept') ? 'true' : 'false'}
                options={[
                  { value: 'false', label: 'FALSE' },
                  { value: 'true', label: 'TRUE' },
                ]}
                onChange={(val) => setValue('confirmedByResDept', val === 'true', { shouldValidate: false })}
                className="mt-[1px]"
              />
              <input type="hidden" {...register('confirmedByResDept')} />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Number of students</label>
              <input type="number" min="0" {...register('studentCount')} className="input py-1 text-[11px] h-7 mt-[1px]" placeholder="0" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Cohorts <span className="text-red-400">*</span></label>
              <input type="number" min="0" {...register('lectureGroup')} className="input py-1 text-[11px] h-7 mt-[1px]" placeholder="0" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Small Groups <span className="text-red-400">*</span></label>
              <input type="number" min="0" {...register('tutorialGroup')} className="input py-1 text-[11px] h-7 mt-[1px]" placeholder="0" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Total Small Groups</label>
              <input type="number" min="0" {...register('totalSmallGroup')} className="input py-1 text-[11px] h-7 mt-[1px]" placeholder="0" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none flex items-center gap-1">
                <Tag className="w-2.5 h-2.5 text-gray-400" />
                Groups-Joint Groups
              </label>
              <GroupCodeSelector allCodes={availableGroupCodes} selected={selectedGroupCodes} conflicts={groupCodeConflicts} onChange={setSelectedGroupCodes} max={Number(watch('totalSmallGroup')) || undefined} />
            </div>
            {/* Col 6: Create Workload button */}
            <div className="flex flex-col justify-end">
              {editingId && (
                <button type="button" onClick={resetForm} className="btn-secondary py-1.5 text-[11px] mb-1">{t('cancel')}</button>
              )}
              <button type="submit" disabled={isPending} className="btn-primary flex items-center justify-center gap-1 py-1.5 text-[11px] w-full">
                {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                {editingId ? 'Save →' : 'Create Workload →'}
              </button>
            </div>

          </div>
        </div>
        )}

        {mode === 'create' && (
        <>
          <input type="hidden" {...register('facultyId')} />
          <input type="hidden" {...register('assignedLectureHours')} />
          <input type="hidden" {...register('assignedTutorialHours')} />
          <input type="hidden" {...register('lectureHours')} />
          <input type="hidden" {...register('seminarHours')} />
          <input type="hidden" {...register('labHours')} />
          <input type="hidden" {...register('totalCoveredLectureHours')} />
          <input type="hidden" {...register('totalCoveredTutorialHours')} />
          <input type="hidden" {...register('totalCoveredLabHours')} />
          <input type="hidden" {...register('uncoveredHours')} />
          <input type="hidden" {...register('lecturesAndTutorialsNo')} />
        </>
        )}

      </form>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader icon={<ClipboardList />} title="Workload" />

      {/* Rejection reason popup */}
      {rejectionPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setRejectionPopup(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Rejection Reason</h3>
              <button onClick={() => setRejectionPopup(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-xs text-gray-500 mb-2 font-medium">{rejectionPopup.profName}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
              {rejectionPopup.reason}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {!isHead && (
        <button
          onClick={() => { setActiveTab('create'); }}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'create'
              ? 'border-primary-600 text-primary-700 bg-primary-50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Create Workload
        </button>
        )}
        <button
          onClick={() => setActiveTab('assign')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'assign'
              ? 'border-primary-600 text-primary-700 bg-primary-50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Assign Workload
        </button>
        <button
          onClick={() => setActiveTab('view')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'view'
              ? 'border-primary-600 text-primary-700 bg-primary-50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          View Workload
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'recent'
              ? 'border-primary-600 text-primary-700 bg-primary-50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Recent Assignments
        </button>
      </div>

      {(activeTab === 'view' || activeTab === 'assign') && (
        <div className="space-y-4">
          {/* Filters Toolbar */}
          {(activeTab === 'view' || activeTab === 'assign') && <div className="card p-4">
            <div className="flex flex-col lg:flex-row lg:items-end gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="label text-xs mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={viewSearch}
                      onChange={(e) => setViewSearch(e.target.value)}
                      placeholder="Faculty, course, program…"
                      className="input pl-8 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="label text-xs mb-1">Program</label>
                  <CustomDropdown
                    value={viewFilterProgram}
                    options={(allPrograms ?? []).map((p: any) => ({ value: p.name, label: p.name }))}
                    onChange={(val) => setViewFilterProgram(val)}
                    placeholder="All Programs"
                    className="w-full"
                    size="md"
                    noCustom
                  />
                </div>
                <div>
                  <label className="label text-xs mb-1">Academic Semester</label>
                  <CustomDropdown
                    value={viewFilterSemesterId}
                    options={(semesters ?? []).map((s: { id: string; name: string }) => ({ value: s.id, label: s.name }))}
                    onChange={(val) => setViewFilterSemesterId(val)}
                    placeholder="All Semesters"
                    className="w-full"
                    size="md"
                    noCustom
                  />
                </div>
                <div>
                  <label className="label text-xs mb-1">Course Type</label>
                  <CustomDropdown
                    value={viewFilterCourseType}
                    options={[
                      { value: 'optional', label: 'Optional' },
                      { value: 'Requires', label: 'Required' },
                    ]}
                    onChange={(val) => setViewFilterCourseType(val)}
                    placeholder="All Types"
                    className="w-full"
                    size="md"
                    noCustom
                  />
                </div>
                <div>
                  <label className="label text-xs mb-1">Status</label>
                  <CustomDropdown
                    value={viewFilterStatus}
                    options={[
                      { value: 'NORMAL', label: 'Normal' },
                      { value: 'OVERLOADED', label: 'Overloaded' },
                      { value: 'UNDERLOADED', label: 'Underloaded' },
                    ]}
                    onChange={(val) => setViewFilterStatus(val)}
                    placeholder="All Status"
                    className="w-full"
                    size="md"
                    noCustom
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {(viewSearch || viewFilterProgram || viewFilterSemesterId || viewFilterCourseType || viewFilterStatus) && (
                  <button
                    onClick={() => {
                      setViewSearch('');
                      setViewFilterProgram('');
                      setViewFilterSemesterId('');
                      setViewFilterCourseType('');
                      setViewFilterStatus('');
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 underline whitespace-nowrap"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>}

          {/* Results count */}
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">{viewFilteredWorkloads.length}</span> of <span className="font-medium text-gray-900">{workloads?.length || 0}</span> workloads
            </p>
          </div>

          {/* Bulk delete bar */}
          {showCheckboxes && (
            <div className="flex items-center gap-3 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg mb-2">
              <span className="text-sm font-medium text-primary-700">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select assignments to delete'}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={handleBulkDelete} disabled={selectedIds.size === 0 || bulkPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" /> Delete {selectedIds.size > 0 ? selectedIds.size : ''}
                </button>
                <button onClick={cancelSelectMode}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Hidden columns restore bar */}
          {hiddenCols.size > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
              <span className="text-amber-700 font-medium shrink-0">Hidden columns:</span>
              {[...hiddenCols].map(k => (
                <button key={k} onClick={() => toggleCol(k)}
                  className="px-2 py-0.5 bg-white border border-amber-300 text-amber-700 rounded hover:bg-amber-100 transition-colors">
                  + {COL_LABELS[k] ?? k}
                </button>
              ))}
              <button onClick={() => setHiddenCols(new Set())} className="ml-auto text-amber-500 hover:text-amber-700 underline">Show all</button>
            </div>
          )}

          {/* ── Matrix View (always on for Assign tab; toggle for View tab) ── */}
          {(matrixView || activeTab === 'assign') && matrixData && (() => {
            const HEADER_BG = '#F1F5F9';
            const BASE_COLS = [
              'Language of Instruction','Year of study','Semester','Program','Course code',
              'Course title','Course Type','Course duration','Course ECTS','Semester ECTS',
              'Responsible Department','Confirmed by res. dept','Number of students','Cohorts',
              'Small Groups','Total number of small groups','Groups-Joint Groups',
              'Lecture hours','Tutorial hours','Lab hours','Total covered hrs/week','Uncovered hours','Lectures and tutorials nº'
            ]; // 23 columns total (Groups-Joint Groups merged)
            const profColsVisible = showProfCols || activeTab === 'view' || activeTab === 'assign';
            const totalProfCols = profColsVisible ? matrixData.depts.reduce((s, d) => hiddenDepts.has(d.deptName) ? s : s + d.profs.length * 3, 0) : 0;
            const visibleBaseCount = BASE_COLS.filter((_, i) => !matrixHiddenCols.has(i)).length;
            const baseStyle: React.CSSProperties = { border: '1px solid #B0C4D8', padding: '4px 6px', textAlign: 'center', whiteSpace: 'nowrap', fontSize: 11, verticalAlign: 'middle' };
            const thBase: React.CSSProperties = { ...baseStyle, background: HEADER_BG, fontWeight: 700 };
            return (<>
            {(matrixHiddenCols.size > 0 || hiddenDepts.size > 0) && (
              <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs mb-2">
                <span className="text-amber-700 font-medium shrink-0">Hidden:</span>
                {[...matrixHiddenCols].sort((a,b)=>a-b).map(i => (
                  <button key={`col-${i}`} onClick={() => toggleMatrixCol(i)}
                    className="px-2 py-0.5 bg-white border border-amber-300 text-amber-700 rounded hover:bg-amber-100 transition-colors">
                    + {BASE_COLS[i]}
                  </button>
                ))}
                {[...hiddenDepts].map(name => (
                  <button key={`dept-${name}`} onClick={() => toggleDept(name)}
                    className="px-2 py-0.5 bg-white border border-amber-300 text-amber-700 rounded hover:bg-amber-100 transition-colors">
                    + {name}
                  </button>
                ))}
                <button onClick={() => { setMatrixHiddenCols(new Set()); setHiddenDepts(new Set()); }} className="ml-auto text-amber-500 hover:text-amber-700 underline">Show all</button>
              </div>
            )}
            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: 'max-content' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    {/* Row 1 — checkbox + planning spacer + department headers + Status/Actions */}
                    <tr>
                      {activeTab === 'assign' && showCheckboxes && <th rowSpan={3} style={{ ...thBase, width: 28, minWidth: 28, padding: '4px' }}>
                        <input type="checkbox"
                          checked={matrixData.rows.length > 0 && matrixData.rows.every(({ base: rb, assignMap: am }) => [rb.id, ...Object.values(am).map((a:any)=>a.id)].every(id => selectedIds.has(id)))}
                          onChange={() => {
                            const allIds = matrixData.rows.flatMap(({ base: rb, assignMap: am }) => [rb.id, ...Object.values(am).map((a:any)=>a.id)]);
                            const allSelected = allIds.every(id => selectedIds.has(id));
                            setSelectedIds(allSelected ? new Set() : new Set(allIds));
                            if (!allSelected) setShowCheckboxes(true);
                          }}
                          className="rounded border-gray-300 text-primary-600" />
                      </th>}
                      {visibleBaseCount > 0 && (
                        <th colSpan={visibleBaseCount} style={{ ...thBase, background: HEADER_BG, fontSize: 10, letterSpacing: 0.5, color: '#1E293B', padding: '6px 10px', fontWeight: 700 }}>
                          {activeTab === 'assign' ? 'Assign Workload' : 'Final Workload'}
                        </th>
                      )}
                      {profColsVisible && matrixData.depts.map((d) => {
                        if (hiddenDepts.has(d.deptName)) return null;
                        return (
                          <th key={d.deptName} colSpan={d.profs.length * 3}
                            title="Click to hide professors"
                            onClick={() => toggleDept(d.deptName)}
                            style={{ border: '1px solid #CBD5E1', padding: '6px 8px', fontWeight: 700, fontSize: 10, textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: 0.5, color: '#1E293B', background: HEADER_BG, cursor: 'pointer', userSelect: 'none' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLElement).style.color = '#DC2626'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = HEADER_BG; (e.currentTarget as HTMLElement).style.color = '#1E293B'; }}>
                            {d.deptName} ▾
                          </th>
                        );
                      })}
                      <th rowSpan={3} style={{ ...thBase, fontSize: 9, fontWeight: 700, color: '#334155', padding: '4px 6px', minWidth: 70, verticalAlign: 'middle' }}>Status</th>
                      {activeTab === 'assign' && <th rowSpan={3} style={{ ...thBase, fontSize: 9, fontWeight: 700, color: '#334155', padding: '4px 6px', minWidth: 50, verticalAlign: 'middle' }}>Actions</th>}
                    </tr>
                    {/* Row 2 — base column names (click to hide) + professor names (vertical) */}
                    <tr>
                      {BASE_COLS.map((h, i) => !matrixHiddenCols.has(i) && (
                        <th key={i} rowSpan={2} onClick={() => toggleMatrixCol(i)} title="Click to hide"
                          style={{ ...thBase, height: 130, width: 26, verticalAlign: 'bottom', padding: '4px 2px', cursor: 'pointer', userSelect: 'none' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLElement).style.color = '#DC2626'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = HEADER_BG; (e.currentTarget as HTMLElement).style.color = '#334155'; }}>
                          <span style={{ display: 'inline-block', writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: 9, fontWeight: 700, lineHeight: 1.3, color: 'inherit' }}>
                            {h}
                          </span>
                        </th>
                      ))}
                      {profColsVisible && matrixData.depts.flatMap((d) => {
                        if (hiddenDepts.has(d.deptName)) return [];
                        return d.profs.map(p => (
                          <th key={p.id} colSpan={3}
                            style={{ height: 130, width: 52, verticalAlign: 'bottom', padding: '4px 2px', textAlign: 'center', border: '1px solid #CBD5E1', background: HEADER_BG }}>
                            <span style={{ display: 'inline-block', writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: 9, fontWeight: 700, lineHeight: 1.3, color: '#334155' }}>
                              {p.firstName} {p.lastName}
                            </span>
                          </th>
                        ));
                      })}
                    </tr>
                    {/* Row 3 — L / T labels (planning cells span via rowSpan) */}
                    <tr>
                      {profColsVisible && matrixData.depts.flatMap((d) => {
                        if (hiddenDepts.has(d.deptName)) return [];
                        return d.profs.flatMap(p => [
                          <th key={`${p.id}-L`} style={{ border: '1px solid #CBD5E1', padding: '5px 6px', fontWeight: 700, fontSize: 10, textAlign: 'center', background: HEADER_BG, color: '#475569', minWidth: 26 }}>Le</th>,
                          <th key={`${p.id}-T`} style={{ border: '1px solid #CBD5E1', padding: '5px 6px', fontWeight: 700, fontSize: 10, textAlign: 'center', background: HEADER_BG, color: '#475569', minWidth: 26 }}>Tu</th>,
                          <th key={`${p.id}-La`} style={{ border: '1px solid #CBD5E1', padding: '5px 6px', fontWeight: 700, fontSize: 10, textAlign: 'center', background: HEADER_BG, color: '#475569', minWidth: 26 }}>La</th>,
                        ]);
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {matrixData.rows.length === 0 ? (
                      <tr>
                        <td colSpan={visibleBaseCount + totalProfCols + (activeTab === 'assign' ? (showCheckboxes ? 3 : 2) : 2)} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                          No workload data yet
                        </td>
                      </tr>
                    ) : matrixData.rows.map(({ base: w, assignMap }, idx) => {
                      // Row background is always plain alternating — professor cells get their own color
                      const assignVals = Object.values(assignMap);
                      const allApproved = assignVals.length > 0 && assignVals.every((a: any) => a.approvalStatus === 'APPROVED');
                      const rowBg = allApproved ? '#FFFFFF' : idx % 2 === 0 ? '#FFFFFF' : '#F7FAFC';
                      const canEdit = activeTab === 'assign' && assigningRowId === w.id;
                      const ie = inlineEdit;
                      const ed = (f: string) => canEdit && ie?.id === w.id && ie?.field === f;
                      const startEd = (f: string, v: any) => { if (!canEdit) return; setInlineEdit({ id: w.id, field: f, value: String(v ?? '') }); };
                      const cellSt = (extra?: React.CSSProperties): React.CSSProperties => ({ border: '1px solid #D1DEE8', padding: '5px 7px', textAlign: 'center', whiteSpace: 'nowrap', background: rowBg, color: '#1E293B', fontSize: 11, verticalAlign: 'middle', cursor: canEdit ? 'cell' : 'default', ...extra });
                      const inp: React.CSSProperties = { width: '100%', textAlign: 'center', background: '#EFF6FF', borderBottom: '2px solid #3B82F6', padding: '3px 4px', fontSize: 11, outline: 'none', margin: '-5px -7px', boxSizing: 'content-box' as const };
                      const numCell = (field: string, display: any, raw: any, extra?: React.CSSProperties) => (
                        <td style={cellSt(extra)} onClick={() => !ed(field) && startEd(field, raw)}>
                          {ed(field) ? <input autoFocus type="text" inputMode="numeric" value={ie!.value} onChange={e => setInlineEdit({ ...ie!, value: e.target.value })} onBlur={saveInlineEdit} onKeyDown={e => { if (e.key==='Enter') saveInlineEdit(); if (e.key==='Escape') cancelInlineEdit(); }} style={inp} /> : (display ?? '')}
                        </td>
                      );
                      const txtCell = (field: string, display: any, raw: any, extra?: React.CSSProperties) => (
                        <td style={cellSt({ maxWidth: extra?.maxWidth, overflow: 'hidden', textOverflow: 'ellipsis', ...extra })} onClick={() => !ed(field) && startEd(field, raw)}>
                          {ed(field) ? <input autoFocus type="text" value={ie!.value} onChange={e => setInlineEdit({ ...ie!, value: e.target.value })} onBlur={saveInlineEdit} onKeyDown={e => { if (e.key==='Enter') saveInlineEdit(); if (e.key==='Escape') cancelInlineEdit(); }} style={inp} /> : (display ?? '')}
                        </td>
                      );
                      const selCell = (field: string, display: any, opts: {v:string;l:string}[], saveVal?: (v:string)=>Record<string,unknown>, extra?: React.CSSProperties) => (
                        <td style={cellSt(extra)} onClick={() => !ed(field) && startEd(field, display)}>
                          {ed(field)
                            ? <select autoFocus value={ie!.value} onChange={e => { quickPatch.mutate({ id: w.id, patch: saveVal ? saveVal(e.target.value) : { [field]: e.target.value } }); setInlineEdit(null); }} onBlur={() => setInlineEdit(null)} style={{ ...inp, padding: '2px' }}>
                                {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                              </select>
                            : (display ?? '')}
                        </td>
                      );
                      const fmCell = (val: any, extra?: React.CSSProperties) => (
                        <td style={{ ...cellSt(), cursor: 'default', ...extra }}>{val ?? ''}</td>
                      );
                      // helper: wrap cell with column-hide check
                      const mh = (i: number) => !matrixHiddenCols.has(i);
                      // All record IDs for this group (base + all assigned professors)
                      const groupIds = [w.id, ...Object.values(assignMap).map((a: any) => a.id).filter((id: string) => id !== w.id)];
                      const groupSelected = groupIds.every(id => selectedIds.has(id));
                      return (
                        <tr key={idx} style={{ transition: 'background 0.15s', background: groupSelected ? '#EFF6FF' : rowBg }}>
                          {activeTab === 'assign' && showCheckboxes && (
                            <td style={{ border: '1px solid #D1DEE8', padding: '4px 6px', textAlign: 'center', background: groupSelected ? '#EFF6FF' : rowBg, verticalAlign: 'middle' }}>
                              <input type="checkbox" checked={groupSelected}
                                onChange={() => {
                                  setSelectedIds(prev => {
                                    const next = new Set(prev);
                                    if (groupSelected) { groupIds.forEach(id => next.delete(id)); }
                                    else { groupIds.forEach(id => next.add(id)); setShowCheckboxes(true); }
                                    return next;
                                  });
                                }}
                                className="rounded border-gray-300 text-primary-600" />
                            </td>
                          )}
                          {mh(0) && selCell('teachingLanguage', w.teachingLanguage?.replace('_','-') || '', [{v:'UZB',l:'UZB'},{v:'UZB_ENG',l:'UZB-ENG'},{v:'RUS_ENG',l:'RUS-ENG'}])}
                          {mh(1) && txtCell('yearOfStudy', (w.yearOfStudy||[]).join(', '), (w.yearOfStudy||[]).join(', '))}
                          {mh(2) && fmCell((w.semesterNumbers||[]).map((s:number)=>`Sem.${s}`).join(', '))}
                          {mh(3) && txtCell('program', w.program||'', w.program||'', { maxWidth: 140 })}
                          {mh(4) && fmCell(w.course?.courseCode, { fontFamily: 'ui-monospace,monospace' })}
                          {mh(5) && txtCell('courseTitle', w.course?.title||'', w.course?.title||'', { maxWidth: 180, textAlign: 'left' })}
                          {mh(6) && selCell('courseType', COURSE_TYPE_LABEL[w.courseType||'']||w.courseType||'', [{v:'optional',l:'Optional'},{v:'Requires',l:'Required'},{v:'Both',l:'Both'}])}
                          {mh(7) && numCell('weekCount', w.weekCount?`${w.weekCount}w`:'', w.weekCount??0)}
                          {mh(8) && fmCell(w.courseECTS??'')}
                          {mh(9) && numCell('semesterECTS', w.semesterECTS??'', w.semesterECTS??0)}
                          {mh(10) && fmCell((w.responsibleDepartment||'').replace(/^Department of\s+/i, ''), { maxWidth: 120 })}
                          {mh(11) && selCell('confirmedByResDept', w.confirmedByResDept?'TRUE':'FALSE', [{v:'false',l:'FALSE'},{v:'true',l:'TRUE'}], v=>({confirmedByResDept:v==='true'}), { color: '#1E293B', fontWeight: 400 })}
                          {mh(12) && numCell('studentCount', w.studentCount??'', w.studentCount??0)}
                          {mh(13) && numCell('lectureGroup', w.lectureGroup??'', w.lectureGroup??0)}
                          {mh(14) && numCell('tutorialGroup', w.tutorialGroup??'', w.tutorialGroup??0)}
                          {mh(15) && numCell('totalSmallGroup', w.totalSmallGroup??'', w.totalSmallGroup??0)}
                          {mh(16) && txtCell('groupCodes', (w.groupCodes||[]).join(', '), (w.groupCodes||[]).join(', '))}
                          {mh(17) && numCell('lectureHours', w.lectureHours??0, w.lectureHours??0)}
                          {mh(18) && numCell('seminarHours', w.seminarHours??0, w.seminarHours??0)}
                          {mh(19) && numCell('labHours', w.labHours??0, w.labHours??0)}
                          {mh(20) && numCell('totalCoveredLectureHours', (w.totalCoveredLectureHours??0)+(w.totalCoveredTutorialHours??0)+((w as any).totalCoveredLabHours??0), (w.totalCoveredLectureHours??0)+(w.totalCoveredTutorialHours??0)+((w as any).totalCoveredLabHours??0), { color:'#0369A1', fontWeight:600 })}
                          {mh(21) && numCell('uncoveredHours', w.uncoveredHours??0, w.uncoveredHours??0, { fontWeight:700, color:(w.uncoveredHours??0)<0?'#DC2626':(w.uncoveredHours??0)>0?'#D97706':'#16A34A' })}
                          {mh(22) && numCell('lecturesAndTutorialsNo', w.lecturesAndTutorialsNo??0, w.lecturesAndTutorialsNo??0)}
                          {profColsVisible && (() => {
                            // Find which professor was most recently assigned (latest updatedAt among PENDING with hours)
                            const pendingAssignments = Object.entries(assignMap)
                              .filter(([, a]: [string, any]) => a?.approvalStatus === 'PENDING' && (a?.l || a?.t || a?.lab));
                            const latestProfId = pendingAssignments.length > 0
                              ? pendingAssignments.reduce((best, cur) => {
                                  const bTime = new Date((assignMap[best[0]] as any)?.updatedAt || 0).getTime();
                                  const cTime = new Date((assignMap[cur[0]] as any)?.updatedAt || 0).getTime();
                                  return cTime > bTime ? cur : best;
                                })[0]
                              : null;
                            return matrixData.depts.flatMap((d) => {
                            if (hiddenDepts.has(d.deptName)) return [];
                            return d.profs.flatMap(p => {
                              const a = assignMap[p.id];
                              const isLatest = p.id === latestProfId;
                              const ltSt: React.CSSProperties = { border: '1px solid #CBD5E1', padding: '3px 4px', textAlign: 'center', background: canEdit ? '#F0F9FF' : rowBg, fontSize: 11, minWidth: 28, verticalAlign: 'middle' };
                              const inpSt: React.CSSProperties = { width: 32, textAlign: 'center', background: 'white', border: '1px solid #93C5FD', borderRadius: 4, padding: '2px 3px', fontSize: 11, outline: 'none' };
                              const draftVal = assignDraft[p.id];
                              const lVal = draftVal ? draftVal.l : String(a?.l ?? '');
                              const tVal = draftVal ? draftVal.t : String(a?.t ?? '');
                              const laVal = draftVal ? draftVal.la : String(a?.lab ?? '');

                              // Cell background: only the LATEST assigned professor gets red (PENDING)
                              const profStatus = a?.approvalStatus;
                              const hasHours = (a?.l || a?.t || a?.lab);
                              const isLatestPending = isLatest && profStatus === 'PENDING' && hasHours;
                              const profCellBg = canEdit
                                ? '#F0F9FF'
                                : profStatus === 'APPROVED'
                                  ? '#FFFFFF'
                                  : profStatus === 'REJECTED' && hasHours
                                    ? '#FEE2E2'
                                    : isLatestPending
                                      ? '#FEF2F2'
                                      : rowBg;
                              const profCellBorder = profStatus === 'APPROVED'
                                ? '1px solid #E2E8F0'
                                : profStatus === 'REJECTED' && hasHours
                                  ? '1px solid #FECACA'
                                  : isLatestPending
                                    ? '1px solid #FECACA'
                                    : '1px solid #CBD5E1';
                              const cellWithStatus: React.CSSProperties = { ...ltSt, background: profCellBg, border: profCellBorder };

                              // REJECTED: span all 3 cols — clickable to show reason
                              if (profStatus === 'REJECTED' && hasHours && !canEdit) {
                                return [
                                  <td key={`${idx}-${p.id}-rej`} colSpan={3}
                                    onClick={() => setRejectionPopup({ profName: `${p.firstName} ${p.lastName}`, reason: a?.rejectionReason || 'No reason provided' })}
                                    style={{ border: '1px solid #FECACA', padding: '4px 6px', textAlign: 'center', background: '#FEE2E2', fontSize: 10, color: '#DC2626', fontWeight: 700, verticalAlign: 'middle', cursor: 'pointer' }}
                                    title="Click to see reason">
                                    ✗ Rejected
                                  </td>,
                                ];
                              }

                              if (canEdit) {
                                return [
                                  <td key={`${idx}-${p.id}-l`} style={{ ...ltSt, background: '#F0F9FF' }}>
                                    <input type="text" inputMode="numeric" value={lVal}
                                      onChange={e => setAssignDraft(prev => ({ ...prev, [p.id]: { l: e.target.value, t: prev[p.id]?.t ?? tVal, la: prev[p.id]?.la ?? laVal } }))}
                                      style={inpSt} placeholder="0" />
                                  </td>,
                                  <td key={`${idx}-${p.id}-t`} style={{ ...ltSt, background: '#F0F9FF' }}>
                                    <input type="text" inputMode="numeric" value={tVal}
                                      onChange={e => setAssignDraft(prev => ({ ...prev, [p.id]: { l: prev[p.id]?.l ?? lVal, t: e.target.value, la: prev[p.id]?.la ?? laVal } }))}
                                      style={inpSt} placeholder="0" />
                                  </td>,
                                  <td key={`${idx}-${p.id}-la`} style={{ ...ltSt, background: '#F0F9FF' }}>
                                    <input type="text" inputMode="numeric" value={laVal}
                                      onChange={e => setAssignDraft(prev => ({ ...prev, [p.id]: { l: prev[p.id]?.l ?? lVal, t: prev[p.id]?.t ?? tVal, la: e.target.value } }))}
                                      style={inpSt} placeholder="0" />
                                  </td>,
                                ];
                              }

                              return [
                                <td key={`${idx}-${p.id}-l`} style={{ ...cellWithStatus, fontWeight: a?.l ? 700 : 400, color: a?.l ? '#1E293B' : '#CBD5E1' }}>{a?.l || ''}</td>,
                                <td key={`${idx}-${p.id}-t`} style={{ ...cellWithStatus, fontWeight: a?.t ? 700 : 400, color: a?.t ? '#1E293B' : '#CBD5E1' }}>{a?.t || ''}</td>,
                                <td key={`${idx}-${p.id}-la`} style={{ ...cellWithStatus, fontWeight: a?.lab ? 700 : 400, color: a?.lab ? '#1E293B' : '#CBD5E1' }}>{a?.lab || ''}</td>,
                              ];
                            });
                          });
                          })()}
                          {/* Status */}
                          <td style={{ border: '1px solid #D1DEE8', padding: '5px 6px', textAlign: 'center', background: rowBg, verticalAlign: 'middle' }}>
                            {activeTab === 'assign' ? (
                              <span style={{
                                display: 'inline-block', padding: '2px 7px', borderRadius: 9999, fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                                background: w.approvalStatus === 'APPROVED' ? '#DCFCE7' : w.approvalStatus === 'REJECTED' ? '#FEE2E2' : '#FEF9C3',
                                color: w.approvalStatus === 'APPROVED' ? '#15803D' : w.approvalStatus === 'REJECTED' ? '#B91C1C' : '#92400E',
                              }}>
                                {w.approvalStatus === 'APPROVED' ? '✓ Confirmed' : w.approvalStatus === 'REJECTED' ? '✗ Rejected' : '⏳ Pending'}
                              </span>
                            ) : (
                              <StatusBadge status={w.isOverloaded ? 'OVERLOADED' : w.isUnderloaded ? 'UNDERLOADED' : 'NORMAL'} />
                            )}
                          </td>
                          {/* Actions — only in Assign tab */}
                          {activeTab === 'assign' && (
                          <td style={{ border: '1px solid #D1DEE8', padding: '4px 6px', textAlign: 'center', background: rowBg, verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              {assignedRowIds.has(w.id) ? (
                                <button disabled
                                  style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#15803D', cursor: 'default', fontSize: 10, fontWeight: 700 }}>
                                  ✓ Assigned
                                </button>
                              ) : assigningRowId === w.id ? (
                                <button onClick={() => submitBatchAssign(w, assignDraft, assignMap)} title="Send to professors"
                                  style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #FDE68A', background: '#FFFBEB', color: '#92400E', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>
                                  Assigning →
                                </button>
                              ) : (
                                <button onClick={() => { setAssigningRowId(w.id); setAssignDraft({}); setShowProfCols(true); }} title="Assign professors"
                                  style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>
                                  Assign
                                </button>
                              )}
                              <button onClick={() => openEdit(w)} title="Edit workload"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#2563EB', cursor: 'pointer' }}>
                                <Pencil style={{ width: 12, height: 12 }} />
                              </button>
                              {(!isHead || w.faculty?.departmentId === user?.departmentId) && (
                                <button onClick={() => { setShowCheckboxes(true); setSelectedIds(new Set(groupIds)); }} title="Delete"
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>
                                  <Trash2 style={{ width: 12, height: 12 }} />
                                </button>
                              )}
                            </div>
                          </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            </>);
          })()}

          {/* Full Data Table — only visible in View tab when matrix view is off */}
          {!matrixView && activeTab !== 'assign' && <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1600px] border-collapse border border-gray-200">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="divide-x divide-gray-200">
                    {showCheckboxes && (
                      <th className="px-1 py-3 w-6">
                        <input
                          type="checkbox"
                          checked={viewFilteredWorkloads.length > 0 && viewFilteredWorkloads.every((w: any) => selectedIds.has(w.id))}
                          onChange={() => toggleSelectAll(viewFilteredWorkloads)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </th>
                    )}
                    {(() => {
                      const TH = ({ k, vertical = true, children }: { k: string; vertical?: boolean; children: React.ReactNode }) => (
                        col(k) ? <th title="Click to hide" onClick={() => toggleCol(k)} className={`px-1 py-3 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap cursor-pointer hover:bg-red-50 hover:text-red-400 select-none transition-colors${vertical ? ' h-40 [writing-mode:vertical-rl] [transform:rotate(180deg)]' : ''}`}>{children}</th> : null
                      );
                      return (<>
                        <TH k="lang">Language of Instruction</TH>
                        {!isHead && <TH k="yearOfStudy">Year of study</TH>}
                        <TH k="semester">Semester</TH>
                        <TH k="program">Program</TH>
                        <TH k="courseCode">Course code</TH>
                        <TH k="courseTitle">Course title</TH>
                        {!isHead && <TH k="courseType">Course Type</TH>}
                        {!isHead && <TH k="courseDuration">Course Duration</TH>}
                        <TH k="courseECTS">Course ECTS</TH>
                        {!isHead && <TH k="semesterECTS">Semester ECTS</TH>}
                        <TH k="resDept">Responsible Department</TH>
                        {!isHead && <TH k="confirmedResDept">Confirmed by res. dept.</TH>}
                        <TH k="students">Number of students</TH>
                        <TH k="cohorts">Cohorts</TH>
                        <TH k="smallGroups">Small Groups</TH>
                        <TH k="totalSmallGroups">Total Small Groups</TH>
                        <TH k="jointGroups">Groups-Joint Groups</TH>
                        <TH k="lectureHours">Lecture hours</TH>
                        <TH k="tutorialHours">Tutorial hours</TH>
                        <TH k="labHours">Lab hours</TH>
                        <TH k="totalCovered">Total covered hrs/week</TH>
                        <TH k="uncovered">Uncovered hours</TH>
                        <TH k="lecTutNo">Lectures &amp; tutorials nº</TH>
                        {/* Academic Staff column removed — use Matrix View */}
                        <TH k="status">Status</TH>
                        <TH k="actions">Actions</TH>
                      </>);
                    })()}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {viewFilteredWorkloads.length === 0 ? (
                    <tr>
                      <td colSpan={isHead ? 21 : 26} className="px-4 py-8 text-center text-gray-400">
                        No workloads found. Try adjusting filters.
                      </td>
                    </tr>
                  ) : (
                    viewFilteredWorkloads.map((w: any) => {
                      const ie = inlineEdit;
                      const editable = (activeTab as string) === 'assign';
                      const ed = (f: string) => editable && ie?.id === w.id && ie?.field === f;
                      const startEd = (f: string, v: any) => { if (!editable) return; setInlineEdit({ id: w.id, field: f, value: String(v ?? '') }); };
                      // live preview value: while typing, formula cells show computed result
                      const pv = (f: string, raw: any) =>
                        previewRow?.id === w.id && previewRow?.vals?.[f] !== undefined ? previewRow.vals[f] : raw;
                      const triggerPreview = (field: string, val: string) => {
                        const row = (workloads as any[])?.find((r: any) => r.id === w.id);
                        if (row) setPreviewRow({ id: w.id, vals: { ...row, ...computeFormulaFields(field, val, row) } });
                      };
                      const numInput = (f: string, _v: any) => (
                        <input autoFocus type="text" inputMode="numeric" value={ie!.value}
                          onChange={e => { setInlineEdit({ ...ie!, value: e.target.value }); triggerPreview(f, e.target.value); }}
                          onBlur={saveInlineEdit}
                          onKeyDown={e => { if (e.key === 'Enter') saveInlineEdit(); if (e.key === 'Escape') cancelInlineEdit(); }}
                          className="w-full text-center bg-blue-50 border-b-2 border-blue-500 px-1 py-2 text-[11px] outline-none" />
                      );
                      const txtInput = (f: string) => (
                        <input autoFocus type="text" value={ie!.value}
                          onChange={e => { setInlineEdit({ ...ie!, value: e.target.value }); triggerPreview(f, e.target.value); }}
                          onBlur={saveInlineEdit}
                          onKeyDown={e => { if (e.key === 'Enter') saveInlineEdit(); if (e.key === 'Escape') cancelInlineEdit(); }}
                          className="w-full text-center bg-blue-50 border-b-2 border-blue-500 px-1 py-2 text-[11px] outline-none" />
                      );
                      const cell = (f: string, display: any, v: any, isNum = true) => (
                        <td className={`p-0 text-center text-[11px] select-none${editable ? ' cursor-cell group' : ''}`} onClick={() => !ed(f) && startEd(f, v)}>
                          {ed(f) ? (isNum ? numInput(f, v) : txtInput(f))
                            : <span className={`block px-2 py-2.5 text-gray-700${editable ? ' group-hover:bg-blue-50/60 transition-colors' : ''}`}>{pv(f, display) ?? '-'}</span>}
                        </td>
                      );
                      const selCell = (f: string, display: any, opts: {v:string;l:string}[], saveVal?: (v:string)=>Record<string,unknown>) => (
                        <td className={`p-0 text-center text-[11px] select-none${editable ? ' cursor-cell group' : ''}`} onClick={() => !ed(f) && startEd(f, display)}>
                          {ed(f)
                            ? <select autoFocus value={ie!.value}
                                onChange={e => { const v=e.target.value; quickPatch.mutate({id:w.id, patch: saveVal ? saveVal(v) : {[f]:v}}); setInlineEdit(null); }}
                                onBlur={() => setInlineEdit(null)}
                                className="w-full bg-blue-50 border-b-2 border-blue-500 px-1 py-2 text-[11px] outline-none">
                                {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                              </select>
                            : <span className={`block px-2 py-2.5 text-gray-700${editable ? ' group-hover:bg-blue-50/60 transition-colors' : ''}`}>{display ?? '-'}</span>}
                        </td>
                      );
                      const formula = (val: any, title: string, red = false) => (
                        <td className="px-2 py-2.5 text-center whitespace-nowrap text-[11px] cursor-default" title={title}>
                          <span className={red && Number(val) < 0 ? 'text-red-600 font-medium' : 'text-gray-700'}>{val ?? 0}</span>
                        </td>
                      );
                      return (
                      <tr key={w.id} className={`divide-x divide-gray-200 border-b border-gray-200 ${
                        showCheckboxes && selectedIds.has(w.id) ? 'bg-primary-100' :
                        w.approvalStatus === 'PENDING' ? 'bg-red-50' :
                        w.approvalStatus === 'REJECTED' ? 'bg-orange-50' : ''
                      }`}>
                        {showCheckboxes && (
                          <td className="px-2 py-2.5 text-center">
                            <input type="checkbox" checked={selectedIds.has(w.id)} onChange={() => toggleSelect(w.id)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                          </td>
                        )}
                        {col('lang') && selCell('teachingLanguage', w.teachingLanguage?.replace('_','-') || '-',
                          [{v:'UZB',l:'UZB'},{v:'UZB_ENG',l:'UZB-ENG'},{v:'RUS_ENG',l:'RUS-ENG'}])}
                        {!isHead && col('yearOfStudy') && cell('yearOfStudy', (w.yearOfStudy||[]).join(', '), (w.yearOfStudy||[]).join(', '), false)}
                        {col('semester') && <td className="px-2 py-2.5 text-center text-gray-600 whitespace-nowrap text-[11px]">{(w.semesterNumbers||[]).map((s:number)=>`Sem.${s}`).join(', ') || '-'}</td>}
                        {col('program') && cell('program', w.program||'-', w.program||'', false)}
                        {col('courseCode') && formula(w.course?.courseCode || '-', 'Auto-filled from Course Title')}
                        {col('courseTitle') && (
                          <td className={`p-0 text-center text-[11px] select-none${editable ? ' cursor-cell group' : ''}`} onClick={() => !ed('courseTitle') && startEd('courseTitle', w.course?.title)}>
                            {ed('courseTitle')
                              ? <select autoFocus value={ie!.value}
                                  onChange={e => { const v=e.target.value; quickPatch.mutate({id:w.id, patch: computeFormulaFields('courseTitle',v,w)}); setInlineEdit(null); }}
                                  onBlur={() => setInlineEdit(null)}
                                  className="w-full bg-blue-50 border-b-2 border-blue-500 px-1 py-2 text-[11px] outline-none">
                                  {(allCourses as any[]||[]).map((c:any)=><option key={c.id} value={c.title}>{c.title}</option>)}
                                </select>
                              : <span className={`block px-2 py-2.5 text-gray-700${editable ? ' group-hover:bg-blue-50/60 transition-colors' : ''}`}>{w.course?.title||'-'}</span>}
                          </td>
                        )}
                        {!isHead && col('courseType') && selCell('courseType', COURSE_TYPE_LABEL[w.courseType||''] || w.courseType || '-',
                          [{v:'optional',l:'Optional'},{v:'Requires',l:'Required'},{v:'Both',l:'Both'}])}
                        {!isHead && col('courseDuration') && cell('weekCount', w.weekCount ? `${w.weekCount}w` : '-', w.weekCount ?? 0)}
                        {col('courseECTS') && formula(w.courseECTS || '-', 'Auto-filled from Course Title')}
                        {!isHead && col('semesterECTS') && cell('semesterECTS', w.semesterECTS || '-', w.semesterECTS ?? 0)}
                        {col('resDept') && formula((w.responsibleDepartment || '-').replace(/^Department of\s+/i, ''), 'Auto-filled from Course Title')}
                        {!isHead && col('confirmedResDept') && selCell('confirmedByResDept', w.confirmedByResDept ? 'TRUE' : 'FALSE',
                          [{v:'false',l:'FALSE'},{v:'true',l:'TRUE'}],
                          v => ({confirmedByResDept: v==='true'}))}
                        {col('students') && cell('studentCount', w.studentCount ?? '-', w.studentCount ?? 0)}
                        {col('cohorts') && cell('lectureGroup', w.lectureGroup ?? '-', w.lectureGroup ?? 0)}
                        {col('smallGroups') && cell('tutorialGroup', w.tutorialGroup ?? '-', w.tutorialGroup ?? 0)}
                        {col('totalSmallGroups') && cell('totalSmallGroup', (w as any).totalSmallGroup ?? '-', (w as any).totalSmallGroup ?? 0)}
                        {col('jointGroups') && cell('groupCodes', (w.groupCodes ?? []).join(', ')||'-', (w.groupCodes ?? []).join(', ')||'', false)}
                        {col('lectureHours') && cell('lectureHours', w.lectureHours ?? 0, w.lectureHours ?? 0)}
                        {col('tutorialHours') && cell('seminarHours', w.seminarHours ?? 0, w.seminarHours ?? 0)}
                        {col('labHours') && cell('labHours', w.labHours ?? 0, w.labHours ?? 0)}
                        {col('totalCovered') && cell('totalCoveredLectureHours', ((w.totalCoveredLectureHours ?? 0) + (w.totalCoveredTutorialHours ?? 0) + ((w as any).totalCoveredLabHours ?? 0)), ((w.totalCoveredLectureHours ?? 0) + (w.totalCoveredTutorialHours ?? 0) + ((w as any).totalCoveredLabHours ?? 0)))}
                        {col('uncovered') && cell('uncoveredHours', w.uncoveredHours ?? 0, w.uncoveredHours ?? 0)}
                        {col('lecTutNo') && cell('lecturesAndTutorialsNo', w.lecturesAndTutorialsNo ?? 0, w.lecturesAndTutorialsNo ?? 0)}
                        {/* Academic Staff column removed — visible in Matrix View */}
                        {col('status') && <td className="px-2 py-2.5 text-center whitespace-nowrap space-y-1">
                          <StatusBadge status={w.isOverloaded ? 'OVERLOADED' : w.isUnderloaded ? 'UNDERLOADED' : 'NORMAL'} />
                          {w.approvalStatus === 'PENDING' && (
                            <span className="block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-100 text-red-700">Pending</span>
                          )}
                          {w.approvalStatus === 'REJECTED' && (
                            <span className="block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-orange-100 text-orange-700" title={w.rejectionReason || ''}>Rejected</span>
                          )}
                          {w.approvalStatus === 'APPROVED' && (
                            <span className="block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-green-100 text-green-700">Accepted</span>
                          )}
                        </td>}
                        {col('actions') && <td className="px-2 py-2.5 text-center">
                          {(!isHead || w.faculty?.departmentId === user?.departmentId) && (
                            <button onClick={() => enterSelectMode(w.id)} title="Delete"
                              className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors mx-auto">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>}
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>}
        </div>
      )}

      {/* Create tab renders the form */}
      {activeTab === 'create' && !isHead && workloadForm('create')}
      {/* ── Recent Assignments ── */}
      {activeTab === 'recent' && (() => {
        const allRecent: any[] = workloads ?? [];
        const sorted = [...allRecent].sort((a, b) => new Date(b.assignedAt || b.createdAt || 0).getTime() - new Date(a.assignedAt || a.createdAt || 0).getTime());
        const term = search.toLowerCase().trim();
        const recentRows = sorted.filter((w: any) => {
          if (term) {
            const n = `${w.faculty?.firstName || ''} ${w.faculty?.lastName || ''} ${w.course?.courseCode || ''} ${w.course?.title || ''}`.toLowerCase();
            if (!n.includes(term)) return false;
          }
          if (recentFilterAssignedBy && w.assignedBy?.role !== recentFilterAssignedBy) return false;
          if (recentFilterDate) {
            if (!w.assignedAt) return false;
            if (new Date(w.assignedAt).toDateString() !== new Date(recentFilterDate).toDateString()) return false;
          }
          return true;
        }).slice(0, 10);

        return (
          <div className="space-y-4">
            {/* Filters */}
            <div className="card p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search staff or course..." className="input pl-8 text-sm w-full" />
                </div>
                <div className="relative">
                  <select value={recentFilterAssignedBy} onChange={(e) => setRecentFilterAssignedBy(e.target.value)}
                    className="input text-sm w-full appearance-none pr-8">
                    <option value="">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="DEPARTMENT_HEAD">Department Head</option>
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                </div>
                <div className="flex gap-2">
                  <input type="date" value={recentFilterDate} onChange={(e) => setRecentFilterDate(e.target.value)}
                    className="input text-sm flex-1" />
                  {(search || recentFilterAssignedBy || recentFilterDate) && (
                    <button onClick={() => { setSearch(''); setRecentFilterAssignedBy(''); setRecentFilterDate(''); }}
                      className="text-xs text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg px-3 whitespace-nowrap">
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Count */}
            <div className="flex items-center justify-between px-1">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-900">{recentRows.length}</span> most recent records
              </p>
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Assigned By</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Assigned To</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Course</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Le</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Tu</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase whitespace-nowrap">La</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Total</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Approval</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Date & Time</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentRows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-gray-400">No assignments found.</td>
                      </tr>
                    ) : recentRows.map((w: any) => {
                      const le = w.assignedLectureHours ?? 0;
                      const tu = w.assignedTutorialHours ?? 0;
                      const la = w.assignedLabHours ?? 0;
                      const total = le + tu + la;
                      const assignerName = w.assignedBy ? `${w.assignedBy.firstName} ${w.assignedBy.lastName}` : null;
                      const assignedAt = w.assignedAt ? new Date(w.assignedAt).toLocaleString('en-GB', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
                      const approvalStatus = w.approvalStatus;
                      return (
                        <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                          {/* Assigned By */}
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <span className="text-xs font-semibold text-gray-800">{assignerName ?? '—'}</span>
                          </td>
                          {/* Assigned To */}
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <span className="text-xs font-semibold text-gray-800">
                              {w.faculty ? `${w.faculty.firstName} ${w.faculty.lastName}` : '—'}
                            </span>
                            {w.faculty?.facultyDepartment && (
                              <div className="text-[10px] text-gray-400 mt-0.5">{w.faculty.facultyDepartment}</div>
                            )}
                          </td>
                          {/* Course */}
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <div className="text-xs font-bold text-gray-700">{w.course?.courseCode || '—'}</div>
                            <div className="text-[10px] text-gray-500 max-w-[160px] truncate">{w.course?.title || ''}</div>
                            {w.semester?.name && <div className="text-[10px] text-gray-400">{w.semester.name}</div>}
                          </td>
                          {/* Le */}
                          <td className="px-3 py-3 text-center">
                            <span className={`text-sm font-bold ${le > 0 ? 'text-blue-600' : 'text-gray-300'}`}>{le > 0 ? le : '—'}</span>
                          </td>
                          {/* Tu */}
                          <td className="px-3 py-3 text-center">
                            <span className={`text-sm font-bold ${tu > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>{tu > 0 ? tu : '—'}</span>
                          </td>
                          {/* La */}
                          <td className="px-3 py-3 text-center">
                            <span className={`text-sm font-bold ${la > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{la > 0 ? la : '—'}</span>
                          </td>
                          {/* Total */}
                          <td className="px-3 py-3 text-center">
                            <span className="text-sm font-bold text-gray-800">{total > 0 ? `${total}h` : '—'}</span>
                          </td>
                          {/* Approval */}
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                              approvalStatus === 'REJECTED'  ? 'bg-red-100 text-red-700'   :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {approvalStatus === 'APPROVED' ? '✓ Accepted' : approvalStatus === 'REJECTED' ? '✗ Rejected' : '⏳ Pending'}
                            </span>
                          </td>
                          {/* Date */}
                          <td className="px-3 py-3 text-center text-[11px] text-gray-500 whitespace-nowrap">{assignedAt}</td>
                          {/* Actions */}
                          <td className="px-3 py-3 text-center">
                            {(!isHead || w.faculty?.departmentId === user?.departmentId) && (
                              <button onClick={() => enterSelectMode(w.id)} title="Delete"
                                className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors mx-auto">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
