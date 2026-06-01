import { PageHeader } from '../../components/shared/PageHeader';
import { useState } from 'react';
import { CustomDropdown } from '../../components/shared/CustomDropdown';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Plus,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  Trash2,
  ChevronRight,
  BookOpen,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { planningApi } from '../../api/planning.api';
import { workloadAssignmentsApi } from '../../api/workload-assignments.api';
import api from '../../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PlanningRow {
  id: string;
  yearOfStudy: number;
  semesterNumber: number;
  teachingLanguage: string;
  studentCount: number;
  lectureGroups: number;
  tutorialGroups: number;
  totalSmallGroups: number;
  labGroups: number;
  jointWith?: string;
  totalCoveredHours: number;
  uncoveredHours: number;
  confirmedByResDept: boolean;
  status: string;
  course: {
    id: string;
    courseCode: string;
    title: string;
    type: string;
    ectsCredits?: number;
    weeklyHours: number;
    weeklyLectureHours?: number;
    weeklyTutorialHours?: number;
    weeklyLabHours?: number;
    department?: { name: string };
  };
  program: { id: string; name: string; code: string; degreeLevel: string };
  semester: { id: string; name: string; weekCount: number; academicYear?: string };
  groups: { id: string; name: string; studentCount: number; groupType: string }[];
  _count: { workloadRecords: number };
}

interface WorkloadAssignment {
  id: string;
  assignType: 'LECTURE' | 'TUTORIAL' | 'LAB';
  groupsCount: number;
  hoursPerWeek: number;
  totalHours: number;
  faculty: { id: string; firstName: string; lastName: string; position?: string; department?: { name: string } };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof AlertCircle }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
  CONFIRMED: { label: 'Confirmed', color: 'bg-primary-100 text-primary-700', icon: CheckCircle2 },
  PUBLISHED: { label: 'Published', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
};

const LANG_LABELS: Record<string, string> = {
  UZB:     'UZB',
  UZB_ENG: 'UZB-ENG',
  RUS_ENG: 'RUS-ENG',
};

const ASSIGN_TYPES = ['LECTURE', 'TUTORIAL', 'LAB'] as const;
type AssignType = typeof ASSIGN_TYPES[number];

const TYPE_CONFIG: Record<AssignType, { label: string; color: string; groupsKey: keyof PlanningRow; hrsKey: string }> = {
  LECTURE: { label: 'Lecture', color: 'bg-primary-50 border-primary-200', groupsKey: 'lectureGroups', hrsKey: 'weeklyLectureHours' },
  TUTORIAL: { label: 'Tutorial', color: 'bg-green-50 border-green-200', groupsKey: 'tutorialGroups', hrsKey: 'weeklyTutorialHours' },
  LAB: { label: 'Lab', color: 'bg-orange-50 border-orange-200', groupsKey: 'labGroups', hrsKey: 'weeklyLabHours' },
};

const WEEKS = 16;

// ─── Helper ───────────────────────────────────────────────────────────────────
function coverageColor(pct: number) {
  if (pct >= 80) return 'text-green-600';
  if (pct >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SemesterPlanningPage() {
  const qc = useQueryClient();
  const [selectedSemester, setSelectedSemester] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const { data: semestersData } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => api.get('/semesters').then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['planning-rows', selectedSemester],
    queryFn: () => planningApi.list({ semesterId: selectedSemester || undefined, limit: 100 }),
    enabled: !!selectedSemester,
  });

  const { data: summaryData } = useQuery({
    queryKey: ['planning-summary', selectedSemester],
    queryFn: () => planningApi.summary(selectedSemester),
    enabled: !!selectedSemester,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      planningApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning-rows'] }),
  });

  const toggleConfirmedMutation = useMutation({
    mutationFn: ({ id, confirmedByResDept }: { id: string; confirmedByResDept: boolean }) =>
      planningApi.update(id, { confirmedByResDept }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning-rows'] }),
  });

  const rows: PlanningRow[] = data?.data ?? [];
  const summary = summaryData;
  const selectedRow = rows.find((r) => r.id === selectedRowId) ?? null;

  const byProgram = rows.reduce<Record<string, PlanningRow[]>>((acc, r) => {
    const key = `${r.program.code} — ${r.program.name}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <PageHeader icon={<CalendarDays />} title="Semester Planning" />
        <div className="flex items-center gap-2">
          <CustomDropdown
            value={selectedSemester}
            onChange={(value) => { setSelectedSemester(value); setSelectedRowId(null); }}
            options={(semestersData ?? []).map((s: { id: string; name: string; academicYear: string }) => ({ value: s.id, label: `${s.name} — ${s.academicYear}` }))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Select Semester"
          />
          {selectedSemester && (
            <button
              onClick={() => setShowAddRow(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          {[
            { label: 'Required Hours', value: Math.round(summary.totalRequired).toLocaleString(), color: 'text-gray-900' },
            { label: 'Covered Hours', value: Math.round(summary.totalCovered).toLocaleString(), color: 'text-green-600' },
            { label: 'Uncovered Hours', value: Math.round(summary.totalUncovered).toLocaleString(), color: summary.totalUncovered > 0 ? 'text-red-600' : 'text-green-600' },
            { label: 'Coverage', value: `${summary.coveragePercent}%`, color: coverageColor(summary.coveragePercent) },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{k.label}</p>
              <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {!selectedSemester ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Select a semester to view planning rows</p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
      ) : (
        <div className="flex flex-1 gap-4 min-h-0">
          {/* Left panel: planning rows */}
          <div className="w-[40%] flex-shrink-0 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto space-y-3">
              {rows.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No planning rows yet. Click "Add Row" to start.</p>
                </div>
              ) : (
                Object.entries(byProgram).map(([programKey, progRows]) => {
                  const byYear = progRows.reduce<Record<number, PlanningRow[]>>((acc, r) => {
                    if (!acc[r.yearOfStudy]) acc[r.yearOfStudy] = [];
                    acc[r.yearOfStudy].push(r);
                    return acc;
                  }, {});

                  return (
                    <div key={programKey} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-4 py-2 bg-primary-50 border-b border-primary-100">
                        <p className="font-semibold text-primary-800 text-sm">{programKey}</p>
                      </div>
                      {Object.entries(byYear).map(([year, yearRows]) => (
                        <div key={year}>
                          <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
                            <p className="text-xs font-medium text-gray-500">Year {year}</p>
                          </div>
                          {yearRows.map((row) => {
                            const cfg = STATUS_CONFIG[row.status] ?? STATUS_CONFIG['DRAFT'];
                            const totalRequired =
                              (row.course.weeklyLectureHours ?? 0) * row.lectureGroups * WEEKS +
                              (row.course.weeklyTutorialHours ?? 0) * row.tutorialGroups * WEEKS +
                              (row.course.weeklyLabHours ?? 0) * row.labGroups * WEEKS;
                            const covPct = totalRequired > 0
                              ? Math.round((row.totalCoveredHours / totalRequired) * 100)
                              : 0;
                            const isSelected = selectedRowId === row.id;

                            return (
                              <div
                                key={row.id}
                                onClick={() => setSelectedRowId(isSelected ? null : row.id)}
                                className={`px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-primary-50 transition-colors ${isSelected ? 'bg-primary-50 border-l-2 border-l-primary-500' : ''}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-mono text-xs text-primary-600">{row.course.courseCode}</span>
                                      <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                        {LANG_LABELS[row.teachingLanguage] ?? row.teachingLanguage}
                                      </span>
                                    </div>
                                    <p className="text-xs font-medium text-gray-900 mt-0.5 truncate">{row.course.title}</p>
                                    {row.course.department && (
                                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                                        Responsible dept: <span className="text-gray-600">{row.course.department.name}</span>
                                      </p>
                                    )}
                                    {/* Confirmed by res. dept toggle */}
                                    <div
                                      className="flex items-center gap-1.5 mt-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleConfirmedMutation.mutate({ id: row.id, confirmedByResDept: !row.confirmedByResDept });
                                      }}
                                    >
                                      <span className="text-xs text-gray-500">Confirmed by res. dept:</span>
                                      <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${row.confirmedByResDept ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                                        {row.confirmedByResDept ? 'TRUE' : 'FALSE'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                      <span>{row.lectureGroups}L / {row.tutorialGroups}T{row.labGroups > 0 ? ` / ${row.labGroups}Lab` : ''}</span>
                                      <span>·</span>
                                      <span>Total small groups: <span className="font-medium text-gray-700">{row.totalSmallGroups}</span></span>
                                      <span>·</span>
                                      <span className={coverageColor(covPct)}>{covPct}% covered</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                                    <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                                  </div>
                                </div>
                                {/* Progress bar */}
                                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${covPct >= 80 ? 'bg-green-500' : covPct >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
                                    style={{ width: `${Math.min(covPct, 100)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: assignment */}
          <div className="flex-1 min-h-0">
            {selectedRow ? (
              <AssignmentPanel
                row={selectedRow}
                onStatusChange={(status) => {
                  updateStatusMutation.mutate({ id: selectedRow.id, status });
                }}
              />
            ) : (
              <div className="h-full bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center text-gray-400">
                <BookOpen className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Select a planning row to manage assignments</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showAddRow && selectedSemester && (
        <AddPlanningRowModal
          semesterId={selectedSemester}
          onClose={() => setShowAddRow(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['planning-rows'] });
            setShowAddRow(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Assignment Panel ─────────────────────────────────────────────────────────
function AssignmentPanel({
  row,
  onStatusChange,
}: {
  row: PlanningRow;
  onStatusChange: (status: string) => void;
}) {
  const qc = useQueryClient();
  const [assignType, setAssignType] = useState<AssignType>('LECTURE');
  const [assigningType, setAssigningType] = useState<AssignType | null>(null);

  const { data: assignmentsData, isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignments', row.id],
    queryFn: () => workloadAssignmentsApi.getByPlanningRow(row.id),
  });

  const { data: facultyData } = useQuery({
    queryKey: ['dept-faculty'],
    queryFn: () => api.get('/users', { params: { role: 'FACULTY', limit: 100 } }).then((r) => r.data.data),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => workloadAssignmentsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments', row.id] }),
  });

  const assignments: WorkloadAssignment[] = assignmentsData?.data ?? [];

  const totalRequired =
    (row.course.weeklyLectureHours ?? 0) * row.lectureGroups * WEEKS +
    (row.course.weeklyTutorialHours ?? 0) * row.tutorialGroups * WEEKS +
    (row.course.weeklyLabHours ?? 0) * row.labGroups * WEEKS;

  const totalAssigned = assignments.reduce((s, a) => s + (a.totalHours ?? 0), 0);
  const covPct = totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 0;

  const getTypeAssignments = (type: AssignType) =>
    assignments.filter((a) => a.assignType === type);

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-primary-600 font-semibold">{row.course.courseCode}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(STATUS_CONFIG[row.status] ?? STATUS_CONFIG['DRAFT']).color}`}>
                {(STATUS_CONFIG[row.status] ?? STATUS_CONFIG['DRAFT']).label}
              </span>
            </div>
            <h2 className="font-bold text-gray-900 mt-0.5">{row.course.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span>{row.program.code}</span>
              <span>·</span>
              <span>Year {row.yearOfStudy}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {row.studentCount} students</span>
            </div>
          </div>
          <div className="flex gap-2">
            {row.status === 'DRAFT' && (
              <button
                onClick={() => onStatusChange('CONFIRMED')}
                className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700"
              >
                Confirm Row
              </button>
            )}
            {row.status === 'CONFIRMED' && (
              <button
                onClick={() => onStatusChange('PUBLISHED')}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
              >
                Publish Row
              </button>
            )}
          </div>
        </div>

        {/* Coverage bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Coverage: {totalAssigned}h / {totalRequired}h</span>
            <span className={`font-semibold ${coverageColor(covPct)}`}>{covPct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${covPct >= 80 ? 'bg-green-500' : covPct >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
              style={{ width: `${Math.min(covPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        {ASSIGN_TYPES.map((type) => {
          const groupsCount = row[TYPE_CONFIG[type].groupsKey] as number;
          if (type === 'LAB' && groupsCount === 0) return null;
          const typeAssignments = getTypeAssignments(type);
          return (
            <button
              key={type}
              onClick={() => setAssignType(type)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${assignType === type ? 'border-b-2 border-primary-600 text-primary-700 bg-primary-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {TYPE_CONFIG[type].label}
              {typeAssignments.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                  {typeAssignments.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {loadingAssignments ? (
          <div className="text-center text-gray-400 py-8">Loading assignments...</div>
        ) : (
          <AssignmentTypeSection
            row={row}
            assignType={assignType}
            assignments={getTypeAssignments(assignType)}
            faculty={facultyData ?? []}
            isAssigning={assigningType === assignType}
            onStartAssign={() => setAssigningType(assignType)}
            onCancelAssign={() => setAssigningType(null)}
            onRemove={(id) => removeMutation.mutate(id)}
            onAssigned={() => {
              qc.invalidateQueries({ queryKey: ['assignments', row.id] });
              setAssigningType(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Assignment Type Section ──────────────────────────────────────────────────
function AssignmentTypeSection({
  row,
  assignType,
  assignments,
  faculty,
  isAssigning,
  onStartAssign,
  onCancelAssign,
  onRemove,
  onAssigned,
}: {
  row: PlanningRow;
  assignType: AssignType;
  assignments: WorkloadAssignment[];
  faculty: { id: string; firstName: string; lastName: string; position?: string }[];
  isAssigning: boolean;
  onStartAssign: () => void;
  onCancelAssign: () => void;
  onRemove: (id: string) => void;
  onAssigned: () => void;
}) {
  const cfg = TYPE_CONFIG[assignType];
  const groupsCount = row[cfg.groupsKey] as number;
  const hrsPerWeek = (row.course[cfg.hrsKey as keyof typeof row.course] as number) ?? 0;
  const totalRequired = groupsCount * hrsPerWeek * WEEKS;

  const totalAssigned = assignments.reduce((s, a) => s + (a.totalHours ?? 0), 0);
  const remaining = Math.max(0, totalRequired - totalAssigned);

  return (
    <div className={`rounded-xl border p-4 ${cfg.color}`}>
      {/* Requirements */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{cfg.label} Assignments</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Required: {groupsCount} groups × {hrsPerWeek} hrs/week × {WEEKS} weeks = <strong>{totalRequired}h</strong>
          </p>
          {remaining > 0 && (
            <p className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> {remaining}h still unassigned
            </p>
          )}
        </div>
        {!isAssigning && (
          <button
            onClick={onStartAssign}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" /> Assign Faculty
          </button>
        )}
      </div>

      {/* Assigned list */}
      {assignments.length > 0 && (
        <div className="space-y-2 mb-3">
          {assignments.map((a) => (
            <div key={a.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-white/80 shadow-sm">
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary-700">
                  {a.faculty.firstName[0]}{a.faculty.lastName[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{a.faculty.firstName} {a.faculty.lastName}</p>
                {a.faculty.department && (
                  <p className="text-xs text-primary-600 font-medium">{a.faculty.department.name}</p>
                )}
                <p className="text-xs text-gray-500">
                  {a.groupsCount} groups · {a.hoursPerWeek}h/wk · <strong>{a.totalHours}h total</strong>
                </p>
              </div>
              <button
                onClick={() => onRemove(a.id)}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Assign form */}
      {isAssigning && (
        <AssignForm
          row={row}
          assignType={assignType}
          faculty={faculty}
          onCancel={onCancelAssign}
          onSaved={onAssigned}
        />
      )}

      {assignments.length === 0 && !isAssigning && (
        <p className="text-xs text-gray-400 text-center py-2">No faculty assigned yet</p>
      )}
    </div>
  );
}

// ─── Assign Form ──────────────────────────────────────────────────────────────
function AssignForm({
  row,
  assignType,
  faculty,
  onCancel,
  onSaved,
}: {
  row: PlanningRow;
  assignType: AssignType;
  faculty: { id: string; firstName: string; lastName: string }[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const cfg = TYPE_CONFIG[assignType];
  const groupsCount = row[cfg.groupsKey] as number;
  const hrsPerWeek = (row.course[cfg.hrsKey as keyof typeof row.course] as number) ?? 0;
  const weekCount = row.semester.weekCount;

  const [facultyId, setFacultyId] = useState('');
  const [groups, setGroups] = useState(groupsCount);

  // ── Fetch selected faculty's existing semester assignments for overload check ──
  const { data: existingAssignments } = useQuery({
    queryKey: ['faculty-assignments-check', facultyId, row.semester.id],
    queryFn: () =>
      workloadAssignmentsApi
        .getByFaculty(facultyId, row.semester.id)
        .then((r) => (r?.data ?? r) as { totalHours: number }[]),
    enabled: !!facultyId,
    staleTime: 10_000,
  });

  // Weekly load of this new assignment
  const newWeeklyHours = groups * hrsPerWeek;
  const newTotalHours = newWeeklyHours * weekCount;

  // Current total hours across ALL existing assignments this semester
  const existingTotalHours = Array.isArray(existingAssignments)
    ? existingAssignments.reduce((s: number, a: any) => s + (a.totalHours ?? 0), 0)
    : 0;
  const existingWeeklyHours = weekCount > 0 ? existingTotalHours / weekCount : 0;

  // After this assignment the faculty's weekly load would be:
  const projectedWeekly = existingWeeklyHours + newWeeklyHours;

  // Get the norm — default 30 h/week (university standard)
  const avgWeeklyLoad = 30; // We use 30 as conservative threshold
  const isOverload = facultyId && projectedWeekly > avgWeeklyLoad;
  const isWarning = facultyId && projectedWeekly > avgWeeklyLoad * 0.85;

  const mutation = useMutation({
    mutationFn: () =>
      workloadAssignmentsApi.create({
        planningRowId: row.id,
        facultyId,
        assignType,
        groupsCount: groups,
      }),
    onSuccess: onSaved,
  });

  return (
    <div className="bg-white rounded-lg border border-primary-200 p-3 space-y-2">
      <p className="text-xs font-semibold text-gray-700">Assign Faculty</p>
      <CustomDropdown
        value={facultyId}
        onChange={setFacultyId}
        options={faculty.map((f) => ({ value: f.id, label: `${f.firstName} ${f.lastName}` }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="Select faculty..."
      />

      {/* ── Workload meter ─────────────────────────────────────────────────── */}
      {facultyId && (
        <div className={`rounded-lg px-3 py-2 text-xs space-y-1.5 ${
          isOverload ? 'bg-red-50 border border-red-200' :
          isWarning  ? 'bg-yellow-50 border border-yellow-200' :
          'bg-green-50 border border-green-100'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`font-semibold flex items-center gap-1 ${
              isOverload ? 'text-red-700' : isWarning ? 'text-yellow-700' : 'text-green-700'
            }`}>
              {isOverload
                ? <><AlertTriangle className="w-3 h-3" /> Overload Warning</>
                : isWarning
                ? <><AlertCircle className="w-3 h-3" /> Near Limit</>
                : <><CheckCircle2 className="w-3 h-3" /> Load OK</>
              }
            </span>
            <span className={`font-bold ${
              isOverload ? 'text-red-700' : isWarning ? 'text-yellow-700' : 'text-green-700'
            }`}>
              {projectedWeekly.toFixed(1)}h/week
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isOverload ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, (projectedWeekly / avgWeeklyLoad) * 100)}%` }}
            />
          </div>
          <div className="text-[10px] flex justify-between text-gray-500">
            <span>Current: {existingWeeklyHours.toFixed(1)}h/wk + New: {newWeeklyHours}h/wk</span>
            <span>Norm: {avgWeeklyLoad}h/wk</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-500">Groups count</label>
          <input
            type="number"
            min={1}
            max={groupsCount}
            value={groups}
            onChange={(e) => setGroups(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mt-0.5"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500">Total hours</label>
          <div className={`px-3 py-1.5 border rounded-lg text-sm mt-0.5 font-medium ${
            isOverload ? 'bg-red-50 border-red-200 text-red-700' :
            isWarning  ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
            'bg-gray-50 border-gray-200 text-gray-700'
          }`}>
            {newTotalHours}h
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !facultyId}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60 transition-colors ${
            isOverload
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          {mutation.isPending ? 'Saving...' : isOverload ? 'Assign (Overload)' : 'Assign'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Add Planning Row Modal ───────────────────────────────────────────────────
function AddPlanningRowModal({
  semesterId,
  onClose,
  onSaved,
}: {
  semesterId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Record<string, unknown>>({
    semesterId,
    yearOfStudy: 1,
    semesterNumber: 1,
    teachingLanguage: 'UZB',
    studentCount: 0,
    lectureGroups: 1,
    tutorialGroups: 1,
    totalSmallGroups: 0,
    labGroups: 0,
    status: 'DRAFT',
    notes: '',
    jointWith: '',
    groupNumbers: '',
  });

  const { data: coursesData } = useQuery({
    queryKey: ['courses-select'],
    queryFn: () => api.get('/courses', { params: { limit: 200 } }).then((r) => r.data.data),
  });
  const { data: programsData } = useQuery({
    queryKey: ['programs-select'],
    queryFn: () => api.get('/programs', { params: { limit: 100 } }).then((r) => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => planningApi.create(data),
    onSuccess: onSaved,
  });

  const f = (key: string) => String(form[key] ?? '');
  const n = (key: string) => Number(form[key] ?? 0);
  const set = (key: string, val: unknown) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900">Add Planning Row</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Course *</label>
            <CustomDropdown
              value={f('courseId')}
              onChange={(value) => set('courseId', value)}
              options={(coursesData ?? []).map((c: { id: string; courseCode: string; title: string }) => ({ value: c.id, label: `${c.courseCode} — ${c.title}` }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Select course..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Program *</label>
            <CustomDropdown
              value={f('programId')}
              onChange={(value) => set('programId', value)}
              options={(programsData ?? []).map((p: { id: string; code: string; name: string }) => ({ value: p.id, label: `${p.code} — ${p.name}` }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Select program..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Teaching Language</label>
            <CustomDropdown
              value={f('teachingLanguage')}
              onChange={(value) => set('teachingLanguage', value)}
              options={[
                { value: 'UZB', label: 'UZB' },
                { value: 'UZB_ENG', label: 'UZB-ENG' },
                { value: 'RUS_ENG', label: 'RUS-ENG' },
              ]}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['yearOfStudy', 'Year of Study'],
              ['semesterNumber', 'Semester Number'],
              ['studentCount', 'Student Count'],
              ['lectureGroups', 'Lecture Groups'],
              ['tutorialGroups', 'Small Groups'],
              ['totalSmallGroups', 'Total Small Groups'],
              ['labGroups', 'Lab Groups'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type="number"
                  min={0}
                  value={n(key)}
                  onChange={(e) => set(key, Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Group Numbers (optional)</label>
            <input
              value={f('groupNumbers')}
              onChange={(e) => set('groupNumbers', e.target.value)}
              placeholder="e.g. CS-101, CS-102"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Joint With (optional)</label>
            <input
              value={f('jointWith')}
              onChange={(e) => set('jointWith', e.target.value)}
              placeholder="Department name if jointly taught"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              rows={2}
              value={f('notes')}
              onChange={(e) => set('notes', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.courseId || !form.programId}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors"
          >
            <Save className="w-4 h-4" />
            {mutation.isPending ? 'Saving...' : 'Add Row'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>
        </div>
        {mutation.isError && <p className="px-6 pb-4 text-red-500 text-xs">Error saving row</p>}
      </div>
    </div>
  );
}
