import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, Plus, BookOpen, ChevronDown, ChevronRight, X, Save, Upload, Trash2, Pencil, PowerOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import ImportModal from '../../components/shared/ImportModal';
import { CustomDropdown } from '../../components/shared/CustomDropdown';
import { PageHeader, FormHeader } from '../../components/shared/PageHeader';

interface Course {
  id: string;
  courseCode: string;
  title: string;
  type: string;
  creditUnits: number;
  weeklyHours: number;
  weeklyLectureHours: number;
  weeklyTutorialHours: number;
  weeklyLabHours: number;
  ectsCredits?: number;
  usCreditHours?: number;
  subjectBoard?: string;
  prerequisites?: string;
  textbook?: string;
  courseDuration?: string;
  semesterOffered?: string;
  degreeLevel?: string;
  learningOutcome1?: string;
  learningOutcome2?: string;
  learningOutcome3?: string;
  learningOutcome4?: string;
  learningOutcome5?: string;
  learningOutcome6?: string;
  learningOutcome7?: string;
  learningOutcome8?: string;
  learningOutcome9?: string;
  learningOutcome10?: string;
  learningOutcome11?: string;
  learningOutcome12?: string;
  learningOutcome13?: string;
  learningOutcome14?: string;
  description?: string;
  isActive: boolean;
  department: { id: string; name: string; code: string };
  partOfTerm?: string;
  format?: string;
  gradeStatus?: string;
  maxStudents?: number;
  seatsAvailable?: number;
  waitlistTotal?: number;
  lastDayToRegister?: string;
  lastDayToAddDrop?: string;
  instructorInfo?: string;
  meetingInfo?: string;
  notes?: string;
  accreditationArea?: string;
  responsibleDepartment?: string;
}

const COURSE_TYPES = ['LECTURE', 'SEMINAR', 'LAB', 'BOTH', 'OTHER'];
const DEGREE_OPTIONS = ['Undergraduate', 'Graduate'];

// ─── Bulk Edit Modal ──────────────────────────────────────────────────────────
function BulkEditModal({
  count,
  departments,
  onClose,
  onSave,
}: {
  count: number;
  departments: { id: string; name: string }[];
  onClose: () => void;
  onSave: (fields: Record<string, unknown>) => void;
}) {
  const [departmentId, setDepartmentId] = useState('');
  const [type, setType] = useState('');
  const [isActive, setIsActive] = useState('');

  function handleSave() {
    const fields: Record<string, unknown> = {};
    if (departmentId) fields.departmentId = departmentId;
    if (type) fields.type = type;
    if (isActive !== '') fields.isActive = isActive === 'true';
    if (Object.keys(fields).length === 0) {
      toast.error('Select at least one field to change');
      return;
    }
    onSave(fields);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Bulk Edit</h2>
            <p className="text-xs text-gray-400 mt-0.5">{count} course(s) selected — only filled fields will be updated</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Responsible Department</label>
            <CustomDropdown
              value={departmentId}
              options={[...departments].sort((a, b) => a.name.localeCompare(b.name)).map((d) => ({ value: d.id, label: d.name }))}
              onChange={(val) => setDepartmentId(val)}
              placeholder="— keep unchanged —"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <CustomDropdown
              value={type}
              options={COURSE_TYPES}
              onChange={(val) => setType(val)}
              placeholder="— keep unchanged —"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <CustomDropdown
              value={isActive}
              options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Deactivated' }]}
              onChange={(val) => setIsActive(val)}
              placeholder="— keep unchanged —"
              className="w-full"
            />
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
          <button onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Save className="w-4 h-4" /> Apply to {count} course(s)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CourseCatalogPage({ readOnly = false }: { readOnly?: boolean }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBoard, setFilterBoard] = useState('');
  const [selected, setSelected] = useState<Course | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  
  const [expandedOutcomes, setExpandedOutcomes] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [checkboxAction, setCheckboxAction] = useState<'delete' | 'deactivate' | 'activate' | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['courses-catalog', debouncedSearch, filterType, page],
    queryFn: () =>
      api.get('/courses', {
        params: {
          search: debouncedSearch || undefined,
          type: filterType || undefined,
          page,
          limit: 25,
          isActive: 'all',
        },
      }).then((r) => r.data),
  });

  const courses: Course[] = data?.data ?? [];
  const meta = data?.meta;

  const { data: deptData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => api.get('/departments', { params: { limit: 100 } }).then((r) => r.data.data),
  });

  const subjectBoards = [...new Set(courses.map((c) => c.subjectBoard).filter(Boolean))];

  const filteredCourses = filterBoard
    ? courses.filter((c) => c.subjectBoard === filterBoard)
    : courses;

  const [bulkPending, setBulkPending] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'view'>(readOnly ? 'view' : 'create');

  // Column-hide state — shared columns list for both tables
  const CATALOG_COLS = ['Subject Board','Course Code','Title','Type','Credits','Max Students','L/T/Lab','Semester','Resp. Dept','ECTS','US Credits','Prerequisites','Degree','Duration','Textbook','Part of Term','Format','Grade Status','Accreditation','Max Enroll','Seats','Waitlist','Last Register','Last Add/Drop','Instructor','Meeting','Notes'];
  const [createHiddenCols, setCreateHiddenCols] = useState<Set<number>>(new Set());
  const [viewHiddenCols, setViewHiddenCols] = useState<Set<number>>(new Set());
  const toggleCreateCol = (i: number) => setCreateHiddenCols(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });
  const toggleViewCol = (i: number) => setViewHiddenCols(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });
  const mhC = (i: number) => !createHiddenCols.has(i);
  const mhV = (i: number) => !viewHiddenCols.has(i);

  function enterSelectMode(action: 'delete' | 'deactivate' | 'activate') {
    setCheckboxAction(action);
    setShowCheckboxes(true);
    setSelectedIds(new Set());
  }
  function cancelSelectMode() {
    setShowCheckboxes(false);
    setCheckboxAction(null);
    setSelectedIds(new Set());
  }

  function handleBulkToggleActive(isActive: boolean) {
    if (selectedIds.size === 0) return;
    setBulkPending(true);
    const selectedCourses = filteredCourses.filter((c) => selectedIds.has(c.id));
    Promise.all(selectedCourses.map((c) => api.put(`/courses/${c.id}`, { isActive })))
      .then(() => { qc.invalidateQueries({ queryKey: ['courses-catalog'] }); toast.success(`${selectedIds.size} course(s) ${isActive ? 'activated' : 'deactivated'}`); cancelSelectMode(); })
      .catch((err: any) => toast.error(err.response?.data?.message || 'Failed'))
      .finally(() => setBulkPending(false));
  }

  function handleBulkEdit(fields: Record<string, unknown>) {
    setBulkPending(true);
    Promise.all(Array.from(selectedIds).map((id) => api.put(`/courses/${id}`, fields)))
      .then(() => {
        qc.invalidateQueries({ queryKey: ['courses-catalog'] });
        toast.success(`${selectedIds.size} course(s) updated`);
        setSelectedIds(new Set());
        setShowBulkEdit(false);
      })
      .catch((err: any) => toast.error(err.response?.data?.message || 'Failed to update courses'))
      .finally(() => setBulkPending(false));
  }

  function handleBulkDelete() {
    if (!window.confirm(`Delete ${selectedIds.size} selected course(s)? This cannot be undone.`)) return;
    setBulkPending(true);
    Promise.all(Array.from(selectedIds).map((id) => api.delete(`/courses/${id}`)))
      .then(() => {
        qc.invalidateQueries({ queryKey: ['courses-catalog'] });
        toast.success(`${selectedIds.size} course(s) deleted`);
        if (selected && selectedIds.has(selected.id)) setSelected(null);
        cancelSelectMode();
      })
      .catch((err: any) => toast.error(err.response?.data?.message || 'Failed to delete courses'))
      .finally(() => setBulkPending(false));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const allSelected = filteredCourses.length > 0 && filteredCourses.every((c) => selectedIds.has(c.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCourses.map((c) => c.id)));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader icon={<BookOpen />} title="Course Catalog" />

      {showImport && (
        <ImportModal
          type="courses"
          onClose={() => setShowImport(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['courses'] })}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {!readOnly && (
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'create'
              ? 'border-primary-600 text-primary-700 bg-primary-50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Create Course Catalog
        </button>
        )}
        <button
          onClick={() => setActiveTab('view')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'view'
              ? 'border-primary-600 text-primary-700 bg-primary-50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          View Course Catalog
        </button>
      </div>

      {activeTab === 'create' && (
      <div className="flex h-full gap-4">
      {/* Left panel — course list */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3 items-center">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search courses..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <CustomDropdown
            value={filterType}
            options={COURSE_TYPES}
            onChange={(val) => setFilterType(val)}
            placeholder="All Types"
            className="w-32 flex-shrink-0"
            size="md"
                    noCustom
          />
          <CustomDropdown
            value={filterBoard}
            options={subjectBoards.filter((b): b is string => typeof b === 'string')}
            onChange={(val) => setFilterBoard(val)}
            placeholder="All Boards"
            className="w-32 flex-shrink-0"
            size="md"
                    noCustom
          />
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {!readOnly && <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4" /> {t('import.importCourses')}
            </button>}
            {!readOnly && <button
              onClick={() => { setSelected(null); setShowForm((v) => !v); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${showForm ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200' : 'bg-primary-600 text-white hover:bg-primary-700 border border-primary-600'}`}
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Hide Form' : 'Add Course'}
            </button>}
          </div>
        </div>

        {/* Bulk selection bar — appears when in select mode */}
        {!readOnly && showCheckboxes && (
          <div className="flex items-center gap-3 mb-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
            <span className="text-sm font-medium text-primary-700">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : `Select items to ${checkboxAction}`}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              {checkboxAction === 'delete' ? (
                <button onClick={handleBulkDelete} disabled={selectedIds.size === 0 || bulkPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" /> Delete {selectedIds.size > 0 ? selectedIds.size : ''}
                </button>
              ) : checkboxAction === 'activate' ? (
                <button onClick={() => handleBulkToggleActive(true)} disabled={selectedIds.size === 0 || bulkPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50">
                  <CheckCircle className="w-3.5 h-3.5" /> Activate {selectedIds.size > 0 ? selectedIds.size : ''}
                </button>
              ) : (
                <button onClick={() => handleBulkToggleActive(false)} disabled={selectedIds.size === 0 || bulkPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50">
                  <PowerOff className="w-3.5 h-3.5" /> Deactivate {selectedIds.size > 0 ? selectedIds.size : ''}
                </button>
              )}
              <button onClick={cancelSelectMode}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </div>
        )}

        {!showForm && !selected && (
        <>
        {/* Hidden columns restore bar */}
        {createHiddenCols.size > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs mb-2">
            <span className="text-gray-500 font-medium shrink-0">Hidden:</span>
            {[...createHiddenCols].sort((a,b)=>a-b).map(i => (
              <button key={i} onClick={() => toggleCreateCol(i)} className="px-2 py-0.5 bg-white border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors text-[11px]">
                + {CATALOG_COLS[i]}
              </button>
            ))}
            <button onClick={() => setCreateHiddenCols(new Set())} className="ml-auto text-primary-500 hover:text-primary-700 underline text-[11px]">Show all</button>
          </div>
        )}
        {/* Table */}
        <div className="flex-1 overflow-auto rounded-xl border border-gray-200 shadow-sm bg-white relative">
          {isFetching && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
                Searching...
              </div>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
          ) : (
            <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: 'max-content', width: '100%' }}>
              {(() => {
                const HEADER_BG = '#F1F5F9';
                const thSt: React.CSSProperties = { background: HEADER_BG, border: '1px solid #B0C4D8', padding: '4px 2px', fontWeight: 700, fontSize: 9, color: '#334155', textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: 0.5, height: 130, verticalAlign: 'bottom', width: 26, cursor: 'pointer', userSelect: 'none' };
                const vTh = (label: string, colIdx: number, extra?: React.CSSProperties) => createHiddenCols.has(colIdx) ? null : (
                  <th title="Click to hide" style={{ ...thSt, ...extra }}
                    onClick={() => toggleCreateCol(colIdx)}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLElement).style.color = '#DC2626'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = HEADER_BG; (e.currentTarget as HTMLElement).style.color = '#334155'; }}>
                    <span style={{ display: 'inline-block', writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: 9, fontWeight: 700, lineHeight: 1.3, color: 'inherit' }}>{label}</span>
                  </th>
                );
                return (
              <thead>
                <tr>
                  {showCheckboxes && (
                    <th style={{ ...thSt, width: 28, height: 28, padding: '4px' }}>
                      <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="rounded border-gray-300 text-primary-600" />
                    </th>
                  )}
                  {vTh('Subject Board',0)}{vTh('Course Code',1)}{vTh('Title',2)}{vTh('Type',3)}{vTh('Credits',4)}{vTh('Max Students',5)}{vTh('L/T/Lab',6)}{vTh('Semester',7)}{vTh('Resp. Dept',8)}{vTh('ECTS',9)}{vTh('US Credits',10)}{vTh('Prerequisites',11)}{vTh('Degree',12)}{vTh('Duration',13)}{vTh('Textbook',14)}{vTh('Part of Term',15)}{vTh('Format',16)}{vTh('Grade Status',17)}{vTh('Accreditation',18)}{vTh('Max Enroll',19)}{vTh('Seats',20)}{vTh('Waitlist',21)}{vTh('Last Register',22)}{vTh('Last Add/Drop',23)}{vTh('Instructor',24)}{vTh('Meeting',25)}{vTh('Notes',26)}{vTh('Outcomes',27, {cursor:'default'})}
                  <th style={{ ...thSt, height: 'auto', padding: '6px 8px', fontSize: 9, letterSpacing: 0.5 }}>Actions</th>
                </tr>
              </thead>
                );
              })()}
              <tbody>
                {filteredCourses.map((course, idx) => (
                  <React.Fragment key={course.id}>
                  {(() => {
                    const rowBg = (selected as any)?.id === course.id || (showCheckboxes && selectedIds.has(course.id)) ? '#EFF6FF' : idx % 2 === 0 ? '#FFFFFF' : '#F7FAFC';
                    const td: React.CSSProperties = { border: '1px solid #D1DEE8', padding: '5px 7px', textAlign: 'center', whiteSpace: 'nowrap', background: rowBg, color: '#1E293B', fontSize: 11, verticalAlign: 'middle' };
                    return (
                  <tr onClick={() => { setSelected(course); setShowForm(false); }}
                    style={{ cursor: 'pointer', opacity: course.isActive ? 1 : 0.5 }}>
                    {showCheckboxes && (
                      <td style={{ ...td, padding: '4px 6px' }} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(course.id)} onChange={() => toggleSelect(course.id)} className="rounded border-gray-300 text-primary-600" />
                      </td>
                    )}
                    {mhC(0)&&<td style={td}>{course.subjectBoard ?? '—'}</td>}
                    {mhC(1)&&<td style={td}>{course.courseCode}</td>}
                    {mhC(2)&&<td style={{ ...td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</td>}
                    {mhC(3)&&<td style={td}>{course.type}</td>}
                    {mhC(4)&&<td style={td}>{course.creditUnits}</td>}
                    {mhC(5)&&<td style={td}>{course.maxStudents ?? '—'}</td>}
                    {mhC(6)&&<td style={td}>{course.weeklyLectureHours ?? 0}/{course.weeklyTutorialHours ?? 0}/{course.weeklyLabHours ?? 0}</td>}
                    {mhC(7)&&<td style={td}>{course.semesterOffered ?? '—'}</td>}
                    {mhC(8)&&<td style={td}>{course.responsibleDepartment ?? course.department?.name ?? '—'}</td>}
                    {mhC(9)&&<td style={td}>{course.ectsCredits ?? '—'}</td>}
                    {mhC(10)&&<td style={td}>{course.usCreditHours ?? '—'}</td>}
                    {mhC(11)&&<td style={{ ...td, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.prerequisites ?? '—'}</td>}
                    {mhC(12)&&<td style={td}>{course.degreeLevel ?? '—'}</td>}
                    {mhC(13)&&<td style={td}>{course.courseDuration ?? '—'}</td>}
                    {mhC(14)&&<td style={{ ...td, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.textbook ?? '—'}</td>}
                    {mhC(15)&&<td style={td}>{course.partOfTerm ?? '—'}</td>}
                    {mhC(16)&&<td style={td}>{course.format ?? '—'}</td>}
                    {mhC(17)&&<td style={td}>{course.gradeStatus ?? '—'}</td>}
                    {mhC(18)&&<td style={td}>{course.accreditationArea ?? '—'}</td>}
                    {mhC(19)&&<td style={td}>{course.maxStudents ?? '—'}</td>}
                    {mhC(20)&&<td style={td}>{course.seatsAvailable ?? '—'}</td>}
                    {mhC(21)&&<td style={td}>{course.waitlistTotal ?? '—'}</td>}
                    {mhC(22)&&<td style={td}>{course.lastDayToRegister ?? '—'}</td>}
                    {mhC(23)&&<td style={td}>{course.lastDayToAddDrop ?? '—'}</td>}
                    {mhC(24)&&<td style={{ ...td, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.instructorInfo ?? '—'}</td>}
                    {mhC(25)&&<td style={{ ...td, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.meetingInfo ?? '—'}</td>}
                    {mhC(26)&&<td style={{ ...td, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.notes ?? '—'}</td>}
                    <td style={{ ...td, cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); setExpandedOutcomes(expandedOutcomes === course.id ? null : course.id); }} style={{ color: '#94A3B8', cursor: 'pointer' }}>
                        {expandedOutcomes === course.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                    <td style={{ ...td, cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <button onClick={() => { setSelected(course); setShowForm(false); }} title="Edit" style={{ display:'flex',alignItems:'center',justifyContent:'center',width:26,height:26,borderRadius:6,border:'1px solid #BFDBFE',background:'#EFF6FF',color:'#2563EB',cursor:'pointer' }}><Pencil style={{width:12,height:12}} /></button>
                        <button onClick={() => { enterSelectMode(course.isActive ? 'deactivate' : 'activate'); setSelectedIds(new Set([course.id])); }} title={course.isActive ? 'Deactivate' : 'Activate'} style={{ display:'flex',alignItems:'center',justifyContent:'center',width:26,height:26,borderRadius:6,border: course.isActive ? '1px solid #FDE68A':'1px solid #BBF7D0',background:course.isActive?'#FFFBEB':'#F0FDF4',color:course.isActive?'#92400E':'#15803D',cursor:'pointer' }}>{course.isActive ? <PowerOff style={{width:12,height:12}} /> : <CheckCircle style={{width:12,height:12}} />}</button>
                        <button onClick={() => { enterSelectMode('delete'); setSelectedIds(new Set([course.id])); }} title="Delete" style={{ display:'flex',alignItems:'center',justifyContent:'center',width:26,height:26,borderRadius:6,border:'1px solid #FECACA',background:'#FEF2F2',color:'#DC2626',cursor:'pointer' }}><Trash2 style={{width:12,height:12}} /></button>
                      </div>
                    </td>
                  </tr>
                    );
                  })()}
                  {expandedOutcomes === course.id && (() => {
                    const outcomes = Array.from({ length: 14 }, (_, i) => i + 1)
                      .map((n) => ({ n, text: (course as any)[`learningOutcome${n}`] }))
                      .filter((o) => o.text);
                    return (
                      <tr key={`outcomes-${course.id}`}>
                        <td colSpan={30} className="p-0 border-b border-primary-100">
                          <div className="bg-gradient-to-b from-primary-50 to-white px-6 py-5">
                            <div className="flex items-center gap-2 mb-4">
                              <span className="w-1 h-5 bg-primary-500 rounded-full" />
                              <h3 className="text-sm font-bold text-gray-800">Learning Outcomes</h3>
                              <span className="text-xs text-gray-400 font-normal">— {course.title}</span>
                              <span className="ml-auto px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-[10px] font-semibold">
                                {outcomes.length} outcome{outcomes.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex gap-6">
                              {outcomes.length > 0 && (
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {outcomes.map((o) => (
                                    <div key={o.n} className="flex gap-2.5 bg-white rounded-lg px-3 py-2 border border-primary-100 shadow-sm">
                                      <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold flex-shrink-0 text-[9px] mt-0.5">{o.n}</span>
                                      <span className="text-xs text-gray-700 leading-relaxed">{o.text}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {(course.description || course.textbook) && (
                                <div className="w-72 flex-shrink-0 space-y-3">
                                  {course.description && (
                                    <div className="bg-white rounded-lg px-3 py-2.5 border border-gray-200 shadow-sm">
                                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                                      <p className="text-xs text-gray-600 leading-relaxed">{course.description}</p>
                                    </div>
                                  )}
                                  {course.textbook && (
                                    <div className="bg-white rounded-lg px-3 py-2.5 border border-gray-200 shadow-sm">
                                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Textbook</p>
                                      <p className="text-xs text-gray-600">{course.textbook}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })()}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 text-sm text-gray-600">
            <span>{meta.total} courses</span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50"
              >Prev</button>
              <span className="px-3 py-1">{page} / {meta.totalPages}</span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50"
              >Next</button>
            </div>
          </div>
        )}
        </>
        )}

        {/* Inline new course form */}
        {!readOnly && showForm && (
          <div className="mt-4 flex-1 min-h-0 overflow-auto">
            <CourseDetail
              course={null}
              departments={deptData ?? []}
              onClose={() => { setShowForm(false); setSelected(null); }}
              onSaved={() => { qc.invalidateQueries({ queryKey: ['courses-catalog'] }); setShowForm(false); setSelected(null); }}
            />
          </div>
        )}

        {/* Inline edit form — same layout as new course */}
        {!readOnly && selected && (
          <div className="mt-4 flex-1 min-h-0 overflow-auto">
            <CourseDetail
              course={selected}
              departments={deptData ?? []}
              onClose={() => { setSelected(null); setShowForm(false); }}
              onSaved={() => { qc.invalidateQueries({ queryKey: ['courses-catalog'] }); setSelected(null); setShowForm(false); }}
            />
          </div>
        )}
      </div>

      {/* ── Bulk Edit Modal ── */}
      {!readOnly && showBulkEdit && (
        <BulkEditModal
          count={selectedIds.size}
          departments={deptData ?? []}
          onClose={() => setShowBulkEdit(false)}
          onSave={handleBulkEdit}
        />
      )}

      </div>
      )}

      {/* ── View Course Catalog Tab ── */}
      {activeTab === 'view' && (
        <div className="space-y-2">
          {viewHiddenCols.size > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs">
              <span className="text-gray-500 font-medium shrink-0">Hidden:</span>
              {[...viewHiddenCols].sort((a,b)=>a-b).map(i => (
                <button key={i} onClick={() => toggleViewCol(i)} className="px-2 py-0.5 bg-white border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors text-[11px]">
                  + {CATALOG_COLS[i]}
                </button>
              ))}
              <button onClick={() => setViewHiddenCols(new Set())} className="ml-auto text-primary-500 hover:text-primary-700 underline text-[11px]">Show all</button>
            </div>
          )}
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          {(() => {
            const HEADER_BG = '#F1F5F9';
            const thSt: React.CSSProperties = { background: HEADER_BG, border: '1px solid #B0C4D8', padding: '4px 2px', fontWeight: 700, fontSize: 9, color: '#334155', textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: 0.5, height: 130, verticalAlign: 'bottom', width: 26, cursor: 'pointer', userSelect: 'none' };
            const vTh2 = (label: string, i: number) => mhV(i) ? (
              <th title="Click to hide" style={thSt} onClick={() => toggleViewCol(i)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='#FEF2F2'; (e.currentTarget as HTMLElement).style.color='#DC2626'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background=HEADER_BG; (e.currentTarget as HTMLElement).style.color='#334155'; }}>
                <span style={{ display:'inline-block', writingMode:'vertical-rl', transform:'rotate(180deg)', whiteSpace:'nowrap', fontSize:9, fontWeight:700, lineHeight:1.3, color:'inherit' }}>{label}</span>
              </th>
            ) : null;
            return (
            <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: 'max-content', width: '100%' }}>
              <thead>
                <tr>
                  {vTh2('Subject Board',0)}{vTh2('Course Code',1)}{vTh2('Title',2)}{vTh2('Type',3)}{vTh2('Credits',4)}{vTh2('Max Students',5)}{vTh2('L/T/Lab',6)}{vTh2('Semester',7)}{vTh2('Resp. Dept',8)}{vTh2('ECTS',9)}{vTh2('US Credits',10)}{vTh2('Prerequisites',11)}{vTh2('Degree',12)}{vTh2('Duration',13)}{vTh2('Textbook',14)}{vTh2('Part of Term',15)}{vTh2('Format',16)}{vTh2('Grade Status',17)}{vTh2('Accreditation',18)}{vTh2('Max Enroll',19)}{vTh2('Seats',20)}{vTh2('Waitlist',21)}{vTh2('Last Register',22)}{vTh2('Last Add/Drop',23)}{vTh2('Instructor',24)}{vTh2('Meeting',25)}{vTh2('Notes',26)}
                  <th style={{ ...thSt, height: 'auto', padding: '6px 8px', fontSize: 9, letterSpacing: 0.5, cursor: 'default' }}>Outcomes</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course, idx) => {
                  const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F7FAFC';
                  const td: React.CSSProperties = { border: '1px solid #D1DEE8', padding: '5px 7px', textAlign: 'center', whiteSpace: 'nowrap', background: rowBg, color: '#1E293B', fontSize: 11, verticalAlign: 'middle' };
                  return (
                  <React.Fragment key={course.id}>
                    <tr style={{ opacity: course.isActive ? 1 : 0.5 }}>
                      {mhV(0)&&<td style={td}>{course.subjectBoard ?? '—'}</td>}
                      {mhV(1)&&<td style={td}>{course.courseCode}</td>}
                      {mhV(2)&&<td style={{ ...td, maxWidth: 160, overflow:'hidden', textOverflow:'ellipsis' }}>{course.title}</td>}
                      {mhV(3)&&<td style={td}>{course.type}</td>}
                      {mhV(4)&&<td style={td}>{course.creditUnits}</td>}
                      {mhV(5)&&<td style={td}>{course.maxStudents ?? '—'}</td>}
                      {mhV(6)&&<td style={td}>{course.weeklyLectureHours ?? 0}/{course.weeklyTutorialHours ?? 0}/{course.weeklyLabHours ?? 0}</td>}
                      {mhV(7)&&<td style={td}>{course.semesterOffered ?? '—'}</td>}
                      {mhV(8)&&<td style={td}>{course.responsibleDepartment ?? course.department?.name ?? '—'}</td>}
                      {mhV(9)&&<td style={td}>{course.ectsCredits ?? '—'}</td>}
                      {mhV(10)&&<td style={td}>{course.usCreditHours ?? '—'}</td>}
                      {mhV(11)&&<td style={{ ...td, maxWidth:100, overflow:'hidden', textOverflow:'ellipsis' }}>{course.prerequisites ?? '—'}</td>}
                      {mhV(12)&&<td style={td}>{course.degreeLevel ?? '—'}</td>}
                      {mhV(13)&&<td style={td}>{course.courseDuration ?? '—'}</td>}
                      {mhV(14)&&<td style={{ ...td, maxWidth:100, overflow:'hidden', textOverflow:'ellipsis' }}>{course.textbook ?? '—'}</td>}
                      {mhV(15)&&<td style={td}>{course.partOfTerm ?? '—'}</td>}
                      {mhV(16)&&<td style={td}>{course.format ?? '—'}</td>}
                      {mhV(17)&&<td style={td}>{course.gradeStatus ?? '—'}</td>}
                      {mhV(18)&&<td style={td}>{course.accreditationArea ?? '—'}</td>}
                      {mhV(19)&&<td style={td}>{course.maxStudents ?? '—'}</td>}
                      {mhV(20)&&<td style={td}>{course.seatsAvailable ?? '—'}</td>}
                      {mhV(21)&&<td style={td}>{course.waitlistTotal ?? '—'}</td>}
                      {mhV(22)&&<td style={td}>{course.lastDayToRegister ?? '—'}</td>}
                      {mhV(23)&&<td style={td}>{course.lastDayToAddDrop ?? '—'}</td>}
                      {mhV(24)&&<td style={{ ...td, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis' }}>{course.instructorInfo ?? '—'}</td>}
                      {mhV(25)&&<td style={{ ...td, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis' }}>{course.meetingInfo ?? '—'}</td>}
                      {mhV(26)&&<td style={{ ...td, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis' }}>{course.notes ?? '—'}</td>}
                      <td className="px-3 py-2.5 text-center">
                        {(() => {
                          const outcomes = Array.from({ length: 14 }, (_, i) => (course as any)[`learningOutcome${i + 1}`]).filter(Boolean);
                          if (outcomes.length === 0) return <span className="text-gray-400 text-xs">—</span>;
                          return (
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedOutcomes(expandedOutcomes === course.id ? null : course.id); }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-200 transition-colors"
                            >
                              {outcomes.length}
                              {expandedOutcomes === course.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                          );
                        })()}
                      </td>
                    </tr>
                    {expandedOutcomes === course.id && (() => {
                      const outcomes = Array.from({ length: 14 }, (_, i) => i + 1)
                        .map((n) => ({ n, text: (course as any)[`learningOutcome${n}`] }))
                        .filter((o) => o.text);
                      return (
                        <tr>
                          <td colSpan={30} className="p-0 border-b border-primary-100">
                            <div className="bg-gradient-to-b from-primary-50 to-white px-6 py-5">
                              <div className="flex items-center gap-2 mb-4">
                                <span className="w-1 h-5 bg-primary-500 rounded-full" />
                                <h3 className="text-sm font-bold text-gray-800">Learning Outcomes</h3>
                                <span className="text-xs text-gray-400 font-normal">— {course.title}</span>
                                <span className="ml-auto px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-[10px] font-semibold">
                                  {outcomes.length} outcome{outcomes.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="flex gap-6">
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {outcomes.map((o) => (
                                    <div key={o.n} className="flex gap-2.5 bg-white rounded-lg px-3 py-2 border border-primary-100 shadow-sm">
                                      <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold flex-shrink-0 text-[9px] mt-0.5">{o.n}</span>
                                      <span className="text-xs text-gray-700 leading-relaxed">{o.text}</span>
                                    </div>
                                  ))}
                                </div>
                                {(course.description || course.textbook) && (
                                  <div className="w-72 flex-shrink-0 space-y-3">
                                    {course.description && (
                                      <div className="bg-white rounded-lg px-3 py-2.5 border border-gray-200 shadow-sm">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                                        <p className="text-xs text-gray-600 leading-relaxed">{course.description}</p>
                                      </div>
                                    )}
                                    {course.textbook && (
                                      <div className="bg-white rounded-lg px-3 py-2.5 border border-gray-200 shadow-sm">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Textbook</p>
                                        <p className="text-xs text-gray-600">{course.textbook}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })()}
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            );
          })()}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomDeptDropdown({
  value,
  options,
  onSelect,
  onRemove,
}: {
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  onRemove: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const display = value || 'Select...';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border border-gray-200 rounded-md px-2 py-1 text-[11px] h-7 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 mt-[1px] text-left flex items-center justify-between"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>{display}</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-0.5 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onSelect(''); setOpen(false); }}
            className="w-full px-2 py-1.5 text-left text-[11px] text-gray-400 hover:bg-gray-50"
          >
            Select...
          </button>
          {options.map((name) => (
            <div
              key={name}
              className="flex items-center justify-between px-2 py-1 hover:bg-gray-50 group"
            >
              <button
                type="button"
                onClick={() => { onSelect(name); setOpen(false); }}
                className={`text-left text-[11px] flex-1 ${value === name ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
              >
                {name}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(name); }}
                className="text-gray-300 hover:text-red-500 text-[10px] px-1 leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
          <div className="border-t border-gray-100">
            <button
              type="button"
              onClick={() => { onSelect('__OTHER__'); setOpen(false); }}
              className="w-full px-2 py-1.5 text-left text-[11px] text-primary-600 hover:bg-primary-50 font-medium"
            >
              + Other (custom)...
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CourseDetail({
  course, departments: _departments, onClose, onSaved,
}: {
  course: Course | null;
  departments: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const getDefaultForm = (c: Course | null) => {
    if (!c) {
      return {
        type: 'LECTURE', maxStudents: 40, isActive: true,
        weeklyLectureHours: 1, weeklyTutorialHours: 2, weeklyLabHours: 0,
        ectsCredits: 6, semesterOffered: 'Both',
      };
    }
    const { department, ...rest } = c;
    return { ...rest, departmentId: department.id };
  };

  const [form, setForm] = useState<Record<string, unknown>>(() => getDefaultForm(course));
  const RESPONSIBLE_DEPTS = ['General Education','English','Mathematics','Computer Science','Education','Pre-primary education','Primary education','Chemistry','Biology','Physics','Geography'];
  const [customDepts, setCustomDepts] = useState<string[]>(() => {
    const current = String((getDefaultForm(course) as Record<string, unknown>).responsibleDepartment ?? '');
    return current !== '' && !RESPONSIBLE_DEPTS.includes(current) ? [current] : [];
  });
  const allResponsibleDepts = [...RESPONSIBLE_DEPTS, ...customDepts];
  const [isCustomResponsibleDept, setIsCustomResponsibleDept] = useState(() => {
    const current = String((getDefaultForm(course) as Record<string, unknown>).responsibleDepartment ?? '');
    return current !== '' && !RESPONSIBLE_DEPTS.includes(current);
  });

  useEffect(() => {
    const nextForm = getDefaultForm(course) as Record<string, unknown>;
    setForm(nextForm);
    const current = String(nextForm.responsibleDepartment ?? '');
    const isCustom = current !== '' && !RESPONSIBLE_DEPTS.includes(current);
    setIsCustomResponsibleDept(isCustom);
    if (isCustom && !customDepts.includes(current)) {
      setCustomDepts(prev => [...prev, current]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      // Strip system/derived fields and any null/undefined/empty-string values.
      // Zod .optional() only accepts undefined — Prisma returns null for empty fields,
      // which would fail enum/positive-number validators.
      // responsibleDepartment is a free-text field (independent of Schools/departmentId FK)
      const SKIP = new Set(['id', 'department', 'weeklyHours', 'createdAt', 'updatedAt', '_outcomeRows', 'creditUnits']);
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (SKIP.has(key)) continue;
        if (value === null || value === undefined || value === '') continue;
        payload[key] = value;
      }
      // departmentId is required FK — use the first available department or a placeholder
      if (!payload.departmentId) {
        // Will be resolved server-side; send responsibleDepartment as the key field
        delete payload.departmentId;
      }
      return course
        ? api.put(`/courses/${course.id}`, payload).then((r) => r.data.data)
        : api.post('/courses', payload).then((r) => r.data.data);
    },
    onSuccess: () => {
      toast.success(course ? 'Course updated successfully' : 'Course created successfully');
      onSaved();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save course');
    },
  });

  function handleSubmit() {
    // Validate required fields
    if (!form.courseCode || String(form.courseCode).trim() === '') {
      toast.error('Course code is required');
      return;
    }
    if (!form.title || String(form.title).trim() === '') {
      toast.error('Title is required');
      return;
    }
    if (!form.responsibleDepartment || String(form.responsibleDepartment).trim() === '') {
      toast.error('Responsible Department is required');
      return;
    }
    mutation.mutate(form);
  }

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/courses/${course?.id}`),
    onSuccess: onSaved,
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete course'),
  });

  const field = (key: string, label: string, type = 'text', opts?: { options?: string[]; number?: boolean; noCustom?: boolean }) => (
    <div key={key}>
      <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">{label}</label>
      {opts?.options ? (
        <CustomDropdown
          value={String(form[key] ?? '')}
          options={opts.options}
          onChange={(val) => setForm(p => ({ ...p, [key]: val }))}
          placeholder="Select..."
          className="w-full mt-[1px]"
          noCustom={opts.noCustom}
        />
      ) : (
        <input
          type={opts?.number ? 'number' : type}
          value={String(form[key] ?? '')}
          onChange={(e) => setForm(p => ({ ...p, [key]: opts?.number ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value }))}
          className="w-full border border-gray-200 rounded-md px-2 py-1 text-[11px] h-7 focus:outline-none focus:ring-1 focus:ring-primary-500 mt-[1px]"
        />
      )}
    </div>
  );

  return (
    <div className="p-4">
      <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-5">
        <FormHeader
          title={course ? 'Edit Course' : 'New Course'}
          subtitle={course ? course.courseCode : 'Fill in the details below'}
          onClose={onClose}
        />

        {/* Row 1: Subject board, Course Title, Course code, Course Type, Semester, Prerequisite */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: "8px" }}>
          {field('subjectBoard', 'Subject board')}
          {field('title', 'Course Title *')}
          {field('courseCode', 'Course code *')}
          {field('type', 'Course Type', 'text', { options: COURSE_TYPES, noCustom: true })}
          {field('semesterOffered', 'Semester', 'text', { options: ['Fall', 'Spring', 'Summer', 'Both'] })}
          {field('prerequisites', 'Prerequisite')}
        </div>

        {/* Row 2: Lecture Hours, Tutorial hours, Lab hours, ECTS credit, US credit, Responsible Department */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: "8px" }}>
          {field('weeklyLectureHours', 'Lecture Hours', 'text', { number: true })}
          {field('weeklyTutorialHours', 'Tutorial hours', 'text', { number: true })}
          {field('weeklyLabHours', 'Lab hours', 'text', { number: true })}
          {field('ectsCredits', 'ECTS credit', 'text', { number: true })}
          {field('usCreditHours', 'US credit', 'text', { number: true })}
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-0 leading-none">Responsible Department *</label>
            {(() => {
              const current = String(form.responsibleDepartment ?? '');
              return (
                <>
                  <CustomDeptDropdown
                    value={current}
                    options={allResponsibleDepts}
                    onSelect={(val) => {
                      if (val === '__OTHER__') {
                        setIsCustomResponsibleDept(true);
                        setForm(p => ({ ...p, responsibleDepartment: '' }));
                      } else {
                        setIsCustomResponsibleDept(false);
                        setForm(p => ({ ...p, responsibleDepartment: val }));
                      }
                    }}
                    onRemove={(val) => {
                      setCustomDepts(prev => prev.filter(d => d !== val));
                      if (current === val) {
                        setForm(p => ({ ...p, responsibleDepartment: '' }));
                      }
                    }}
                  />
                  {isCustomResponsibleDept && (
                    <div className="flex gap-1 mt-1">
                      <input
                        type="text"
                        value={current}
                        onChange={(e) => setForm(p => ({ ...p, responsibleDepartment: e.target.value }))}
                        placeholder="Enter department name"
                        className="flex-1 border border-gray-200 rounded-md px-2 py-1 text-[11px] h-7 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = current.trim();
                          if (!trimmed) {
                            toast.error('Please enter a department name');
                            return;
                          }
                          if (!customDepts.includes(trimmed)) {
                            setCustomDepts(prev => [...prev, trimmed]);
                          }
                          setIsCustomResponsibleDept(false);
                          setForm(p => ({ ...p, responsibleDepartment: trimmed }));
                          toast.success(`Added: ${trimmed}`);
                        }}
                        className="px-2 h-7 bg-primary-600 text-white rounded-md text-[10px] font-medium hover:bg-primary-700"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Row 3: Degree, New Description, Textbook, Syllabus Template, Accreditation subject area */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: "8px" }}>
          {field('degreeLevel', 'Degree', 'text', { options: DEGREE_OPTIONS })}
          {field('description', 'New Description')}
          {field('textbook', 'Textbook')}
          {field('syllabusTemplate', 'Syllabus Template')}
          {field('accreditationArea', 'Accreditation subject area')}
          {field('courseDuration', 'Term')}
        </div>

        {/* Row 4: Part of Term, Format, Grade Status, Maximum Enrollment, Seats Available, Waitlist Total */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: "8px" }}>
          {field('partOfTerm', 'Part of Term', 'text', { options: ['full-term', 'part-term'] })}
          {field('format', 'Format', 'text', { options: ['online', 'on-campus'] })}
          {field('gradeStatus', 'Grade Status', 'text', { options: ['GPA', 'P/F', 'S/U', 'Audit', 'Other'] })}
          {field('maxStudents', 'Maximum Enrollment', 'text', { number: true })}
          {field('seatsAvailable', 'Seats Available', 'text', { number: true })}
          {field('waitlistTotal', 'Waitlist Total', 'text', { number: true })}
        </div>

        {/* Row 5: Last day to register, Last date to add/drop, Instructor Info, Meeting Info */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: "8px" }}>
          {field('lastDayToRegister', 'Last day to register', 'date')}
          {field('lastDayToAddDrop', 'Last date to add/drop', 'date')}
          {field('instructorInfo', 'Instructor Info')}
          {field('meetingInfo', 'Meeting Info')}
        </div>

        {/* Learning Outcomes — dynamic list (last section) */}
        {(() => {
          const MAX = 14;
          const filled = Array.from({ length: MAX }, (_, i) => String(form[`learningOutcome${i + 1}`] ?? ''));
          const count = filled.filter(Boolean).length || 1;
          const visibleCount = Math.min(MAX, Math.max(count, (form._outcomeRows as number | undefined) ?? count));
          const setVisible = (n: number) => setForm(p => ({ ...p, _outcomeRows: n }));
          return (
            <div className="pt-1 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Learning Outcomes</span>
                <span className="text-[10px] text-gray-400">{visibleCount} / {MAX}</span>
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: visibleCount }, (_, i) => i + 1).map((n) => (
                  <div key={n} className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 mt-[1px] rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold flex-shrink-0">{n}</span>
                    <input type="text" value={String(form[`learningOutcome${n}`] ?? '')}
                      onChange={(e) => setForm(p => ({ ...p, [`learningOutcome${n}`]: e.target.value }))}
                      placeholder={`Outcome ${n}…`}
                      className="flex-1 border border-gray-200 rounded-md px-2 py-1 text-[11px] h-7 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                    {n === visibleCount && n > 1 && (
                      <button type="button" onClick={() => { setForm(p => ({ ...p, [`learningOutcome${n}`]: undefined })); setVisible(n - 1); }}
                        className="w-5 h-5 mt-[1px] flex-shrink-0 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-xs font-bold">×</button>
                    )}
                  </div>
                ))}
              </div>
              {visibleCount < MAX && (
                <button type="button" onClick={() => setVisible(visibleCount + 1)}
                  className="mt-2 flex items-center gap-1.5 text-[11px] text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">+</span>
                  Add outcome
                </button>
              )}
            </div>
          );
        })()}

      </div>

      <div className="flex gap-2 mt-5">
        <button
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors"
        >
          <Save className="w-4 h-4" />
          {mutation.isPending ? 'Saving...' : course ? 'Update' : 'Create'}
        </button>
        {course && (
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${course.courseCode}?`)) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-40 ml-auto"
            title="Delete Course"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {mutation.isError && (
        <div className="text-red-500 text-xs mt-2 bg-red-50 p-2 rounded border border-red-100">
          <p className="font-semibold">{ (mutation.error as any)?.response?.data?.message || 'Error saving course' }</p>
          { (mutation.error as any)?.response?.data?.errors && (
            <ul className="list-disc ml-4 mt-1">
              { Object.entries((mutation.error as any).response.data.errors.fieldErrors).map(([field, msgs]: any) => (
                <li key={field}>{msgs[0]}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
