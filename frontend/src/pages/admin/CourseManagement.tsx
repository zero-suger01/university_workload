import { PageHeader } from '../../components/shared/PageHeader';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Pencil, PowerOff, Trash2, Loader2, X , BookMarked} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../api/client';
import StatusBadge from '../../components/shared/StatusBadge';
import AddCourseModal from '../../components/admin/AddCourseModal';
import BaseModal from '../../components/shared/BaseModal';
import { CustomDropdown } from '../../components/shared/CustomDropdown';

// ─── Edit schema ──────────────────────────────────────────────────────────────
const editSchema = z.object({
  courseCode: z.string().min(1).max(20).toUpperCase(),
  title: z.string().min(1),
  type: z.enum(['LECTURE', 'SEMINAR', 'LAB', 'BOTH']),
  creditUnits: z.number().positive(),
  weeklyLectureHours: z.number().nonnegative().default(0),
  weeklyTutorialHours: z.number().nonnegative().default(0),
  weeklyLabHours: z.number().nonnegative().default(0),
  departmentId: z.string().min(1),
  description: z.string().optional(),
});
type EditForm = z.infer<typeof editSchema>;

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
  description?: string;
  isActive: boolean;
  department: { id: string; name: string };
  subjectBoard?: string;
  semesterOffered?: string;
  ectsCredits?: number;
  prerequisites?: string;
  degreeLevel?: string;
}

// ─── Confirm delete dialog ────────────────────────────────────────────────────
function ConfirmDeleteModal({
  course,
  onConfirm,
  onCancel,
  isPending,
}: {
  course: Course;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <BaseModal title="Delete Course" onClose={onCancel}>
      <div className="space-y-4">
      <PageHeader icon={<BookMarked />} title="Course Management" />
        <p className="text-sm text-gray-700">
          Are you sure you want to permanently delete{' '}
          <span className="font-semibold text-gray-900">{course.courseCode} — {course.title}</span>?
        </p>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          If this course is referenced by planning rows or workload records, deletion will be blocked
          and you will be asked to deactivate it instead.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete Permanently
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

// ─── Edit course modal ────────────────────────────────────────────────────────
function EditCourseModal({
  course,
  onClose,
}: {
  course: Course;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { t } = useTranslation();

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then((r) => r.data.data),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      courseCode: course.courseCode,
      title: course.title,
      type: course.type as EditForm['type'],
      creditUnits: course.creditUnits,
      weeklyLectureHours: course.weeklyLectureHours ?? 0,
      weeklyTutorialHours: course.weeklyTutorialHours ?? 0,
      weeklyLabHours: course.weeklyLabHours ?? 0,
      departmentId: course.department.id,
      description: course.description ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: EditForm) => api.put(`/courses/${course.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course updated successfully');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update course'),
  });

  return (
    <BaseModal title={`Edit — ${course.courseCode}`} onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{t('code')}</label>
            <input {...register('courseCode')} className="input" />
            {errors.courseCode && <p className="text-xs text-red-500 mt-1">{errors.courseCode.message}</p>}
          </div>
          <div>
            <label className="label">{t('type')}</label>
            <CustomDropdown
              value={watch('type') || ''}
              options={[
                { value: 'LECTURE', label: 'Lecture' },
                { value: 'SEMINAR', label: 'Seminar' },
                { value: 'LAB', label: 'Lab' },
                { value: 'BOTH', label: 'Both (Lecture + Lab)' },
              ]}
              onChange={(val) => setValue('type', val as EditForm['type'], { shouldValidate: true })}
              className="input"
            />
          </div>
          <div className="col-span-2">
            <label className="label">{t('title')}</label>
            <input {...register('title')} className="input" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          <div className="col-span-2">
            <label className="label">{t('department')}</label>
            <CustomDropdown
              value={watch('departmentId') || ''}
              options={(departments ?? []).map((d: any) => ({ value: d.id, label: d.name }))}
              onChange={(val) => setValue('departmentId', val, { shouldValidate: true })}
              className="input"
            />
            {errors.departmentId && <p className="text-xs text-red-500 mt-1">{errors.departmentId.message}</p>}
          </div>
          <div>
            <label className="label">{t('credits')}</label>
            <input {...register('creditUnits', { valueAsNumber: true })} type="number" step="0.5" className="input" />
          </div>
        </div>

        <div>
          <label className="label">{t('hoursWeek') || 'Hours / Week'}</label>
          <div className="grid grid-cols-3 gap-2">
            {(['weeklyLectureHours', 'weeklyTutorialHours', 'weeklyLabHours'] as const).map((key, i) => (
              <div key={key}>
                <span className="text-xs text-gray-500">{['Lecture', 'Tutorial', 'Lab'][i]}</span>
                <input
                  {...register(key, { valueAsNumber: true })}
                  type="number"
                  min="0"
                  step="0.5"
                  className="input mt-0.5"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea {...register('description')} rows={2} className="input resize-none" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">{t('cancel')}</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {mutation.isPending ? 'Saving...' : t('save')}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CourseManagement() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [checkboxAction, setCheckboxAction] = useState<'delete' | 'deactivate' | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['courses', debouncedSearch, showInactive],
    queryFn: () =>
      api.get('/courses', {
        params: { search: debouncedSearch || undefined, limit: 100, isActive: showInactive ? 'all' : 'true' },
      }).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course deleted');
      setDeleteCourse(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete course');
      setDeleteCourse(null);
    },
  });

  const courses: Course[] = data ?? [];

  function enterSelectMode(action: 'delete' | 'deactivate') {
    setCheckboxAction(action);
    setShowCheckboxes(true);
    setSelectedIds(new Set());
  }
  function cancelSelectMode() {
    setShowCheckboxes(false);
    setCheckboxAction(null);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  const allSelected = courses.length > 0 && courses.every((i) => selectedIds.has(i.id));
  function toggleSelectAll() { allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(courses.map((i) => i.id))); }

  function handleBulkToggleActive(targetActive: boolean) {
    setBulkPending(true);
    Promise.all(Array.from(selectedIds).map((id) => api.put(`/courses/${id}`, { isActive: targetActive })))
      .then(() => { qc.invalidateQueries({ queryKey: ['courses'] }); toast.success(`${selectedIds.size} course(s) updated`); cancelSelectMode(); })
      .catch((err: any) => toast.error(err.response?.data?.message || 'Failed'))
      .finally(() => setBulkPending(false));
  }
  function handleBulkDelete() {
    if (!window.confirm(`Delete ${selectedIds.size} course(s)? This cannot be undone.`)) return;
    setBulkPending(true);
    Promise.all(Array.from(selectedIds).map((id) => api.delete(`/courses/${id}`)))
      .then(() => { qc.invalidateQueries({ queryKey: ['courses'] }); toast.success(`${selectedIds.size} course(s) deleted`); cancelSelectMode(); })
      .catch((err: any) => toast.error(err.response?.data?.message || 'Failed to delete'))
      .finally(() => setBulkPending(false));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder={t('searchCourses')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            Show Deactivated Courses
          </label>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> {t('addCourse')}
        </button>
      </div>

      {showAdd && (
        <AddCourseModal onClose={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ['courses'] }); }} />
      )}
      {editCourse && <EditCourseModal course={editCourse} onClose={() => setEditCourse(null)} />}
      {deleteCourse && (
        <ConfirmDeleteModal
          course={deleteCourse}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteCourse.id)}
          onCancel={() => setDeleteCourse(null)}
        />
      )}

      {showCheckboxes && (
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

      <div className="card p-0 overflow-hidden relative">
        {isFetching && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
              Searching...
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                {showCheckboxes && (
                  <th className="px-2 py-2.5 text-center border-r border-gray-200">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  </th>
                )}
                {['Subject Board', t('code'), t('title'), t('type'), t('credits'), 'L/T/Lab', 'Semester', 'ECTS', t('department'), 'Degree', t('status'), 'Actions'].map((h) => (
                  <th key={h} className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={13} className="px-4 py-8 text-center text-gray-400">{t('loading')}</td></tr>
              ) : courses.length === 0 ? (
                <tr><td colSpan={13} className="px-4 py-8 text-center text-gray-400">No courses found</td></tr>
              ) : courses.map((c) => (
                <tr key={c.id} className={`border-b border-gray-200 hover:bg-gray-50 ${!c.isActive ? 'opacity-60' : ''} ${showCheckboxes && selectedIds.has(c.id) ? 'bg-primary-50' : ''}`}>
                  {showCheckboxes && (
                    <td className="px-2 py-2 text-center border-r border-gray-200" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    </td>
                  )}
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{c.subjectBoard ?? '—'}</td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{c.courseCode}</td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200 max-w-xs truncate">{c.title}</td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200"><StatusBadge status={c.type} /></td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{c.creditUnits}</td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                    {c.weeklyLectureHours ?? 0}/{c.weeklyTutorialHours ?? 0}/{c.weeklyLabHours ?? 0}
                  </td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{c.semesterOffered ?? '—'}</td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                    {c.ectsCredits ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">{c.ectsCredits}</span> : '—'}
                  </td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{c.department?.name}</td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{c.degreeLevel ?? '—'}</td>
                  <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200"><StatusBadge status={c.isActive ? 'ACTIVE' : 'CANCELLED'} /></td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditCourse(c)}
                        title="Edit"
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { enterSelectMode('deactivate'); setSelectedIds(new Set([c.id])); }}
                        title={c.isActive ? 'Deactivate / enter select mode' : 'Activate / enter select mode'}
                        className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                          c.isActive
                            ? 'border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100'
                            : 'border-green-200 text-green-600 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        <PowerOff className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { enterSelectMode('delete'); setSelectedIds(new Set([c.id])); }}
                        title="Delete / enter select mode"
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
