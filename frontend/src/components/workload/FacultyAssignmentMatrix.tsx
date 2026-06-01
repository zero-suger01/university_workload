import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import toast from 'react-hot-toast';
import { ChevronDown, ChevronRight, X, Loader2, Save, ArrowLeft, UserPlus } from 'lucide-react';
import api from '../../api/client';
import { workloadsApi } from '../../api/workloads.api';

interface FacultyAssignment {
  facultyId: string;
  firstName: string;
  lastName: string;
  departmentName: string;
  lectureHours: number;
  seminarHours: number;
  labHours: number;
  workloadId?: string;
  isDirty: boolean;
}

export interface WorkloadContext {
  courseId: string;
  semesterId: string;
  teachingLanguage?: string;
  yearOfStudy: number[];
  semesterNumbers: number[];
  program: string[];
  courseCode: string;
  courseTitle: string;
  courseType?: string;
  weekCount: number;
  courseECTS: number;
  semesterECTS: number;
  responsibleDepartment: string;
  confirmedByResDept: boolean;
  studentCount: number;
  lectureGroup: number;
  tutorialGroup: number;
  totalSmallGroup: number;
  school?: string;
  groupCodes: string[];
}

interface Props {
  context: WorkloadContext;
  catalogHours: { weeklyLectureHours: number; weeklyTutorialHours: number; weeklyLabHours: number };
  semesterName?: string;
  onSaved: () => void;
  onBack: () => void;
}

export default function FacultyAssignmentMatrix({ context, catalogHours, semesterName, onSaved, onBack }: Props) {
  const qc = useQueryClient();

  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [deptProfessors, setDeptProfessors] = useState<Record<string, any[]>>({});
  const [savingAll, setSavingAll] = useState(false);
  const [deptLoading, setDeptLoading] = useState<Set<string>>(new Set());

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then((r: any) => r.data.data),
    staleTime: 60_000,
  });

  // Fetch existing assignments for this course+semester
  const { data: courseAssignments, isLoading: caLoading } = useQuery({
    queryKey: ['course-assignments', context.courseId, context.semesterId],
    queryFn: () => workloadsApi.getCourseAssignments(context.courseId, context.semesterId),
    enabled: !!context.courseId && !!context.semesterId,
    staleTime: 5_000,
  });

  // Initialize assignments from existing data
  useEffect(() => {
    if (courseAssignments?.assignments) {
      const existing: FacultyAssignment[] = courseAssignments.assignments
        .filter((a: any) => a.faculty)
        .map((a: any) => ({
          facultyId: a.facultyId,
          firstName: a.faculty?.firstName || '',
          lastName: a.faculty?.lastName || '',
          departmentName: a.faculty?.department?.name || '',
          lectureHours: a.lectureHours || 0,
          seminarHours: a.seminarHours || 0,
          labHours: a.labHours || 0,
          workloadId: a.id,
          isDirty: false,
        }));
      setAssignments(existing);
    }
  }, [courseAssignments]);

  // Fetch professors for a department
  async function fetchProfessors(deptId: string) {
    if (deptProfessors[deptId]) return;
    setDeptLoading((prev) => new Set(prev).add(deptId));
    try {
      const res = await api.get('/users', { params: { departmentId: deptId, role: 'FACULTY', limit: 200 } });
      setDeptProfessors((prev) => ({ ...prev, [deptId]: res.data.data }));
    } catch {
      toast.error('Failed to load professors');
    } finally {
      setDeptLoading((prev) => {
        const next = new Set(prev);
        next.delete(deptId);
        return next;
      });
    }
  }

  function toggleDept(deptId: string) {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) {
        next.delete(deptId);
      } else {
        next.add(deptId);
        fetchProfessors(deptId);
      }
      return next;
    });
  }

  function addFaculty(faculty: any) {
    if (assignments.some((a) => a.facultyId === faculty.id)) {
      toast.error('This professor is already assigned to this course');
      return;
    }
    setAssignments((prev) => [
      ...prev,
      {
        facultyId: faculty.id,
        firstName: faculty.firstName,
        lastName: faculty.lastName,
        departmentName: faculty.department?.name || '',
        lectureHours: 0,
        seminarHours: 0,
        labHours: 0,
        isDirty: true,
      },
    ]);
  }

  function removeFaculty(index: number) {
    const a = assignments[index];
    if (a.workloadId) {
      workloadsApi
        .delete(a.workloadId)
        .then(() => {
          qc.invalidateQueries({ queryKey: ['workloads-all'] });
          qc.invalidateQueries({ queryKey: ['course-assignments', context.courseId, context.semesterId] });
          toast.success(`${a.firstName} ${a.lastName} removed`);
          setAssignments((prev) => prev.filter((_, i) => i !== index));
        })
        .catch((err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to remove');
        });
    } else {
      setAssignments((prev) => prev.filter((_, i) => i !== index));
    }
  }

  function updateHours(index: number, field: 'lectureHours' | 'seminarHours' | 'labHours', value: string) {
    const num = parseFloat(value) || 0;
    setAssignments((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: num, isDirty: true } : a))
    );
  }

  // ── Calculations ──
  const totalL = useMemo(() => assignments.reduce((sum, a) => sum + (a.lectureHours || 0), 0), [assignments]);
  const totalT = useMemo(() => assignments.reduce((sum, a) => sum + (a.seminarHours || 0), 0), [assignments]);
  const totalLab = useMemo(() => assignments.reduce((sum, a) => sum + (a.labHours || 0), 0), [assignments]);
  const reqL = catalogHours.weeklyLectureHours || 0;
  const reqT = catalogHours.weeklyTutorialHours || 0;
  const reqLab = catalogHours.weeklyLabHours || 0;
  const uncoveredL = reqL - totalL;
  const uncoveredT = reqT - totalT;
  const uncoveredLab = reqLab - totalLab;
  const totalCovered = totalL + totalT + totalLab;
  const totalRequired = reqL + reqT + reqLab;
  const totalUncovered = totalRequired - totalCovered;

  const hasDirty = assignments.some((a) => a.isDirty);

  // ── Save all dirty assignments ──
  async function saveAll() {
    if (!hasDirty) {
      toast('No changes to save');
      return;
    }
    setSavingAll(true);
    const dirty = assignments.filter((a) => a.isDirty);
    let successCount = 0;
    let errorCount = 0;

    for (const a of dirty) {
      const payload = {
        facultyId: a.facultyId,
        courseId: context.courseId,
        semesterId: context.semesterId,
        lectureHours: a.lectureHours,
        seminarHours: a.seminarHours,
        labHours: a.labHours,
        groupCodes: context.groupCodes,
        program: context.program.join(', '),
        teachingLanguage: context.teachingLanguage,
        yearOfStudy: context.yearOfStudy,
        semesterNumbers: context.semesterNumbers,
        courseType: context.courseType,
        weekCount: context.weekCount,
        courseECTS: context.courseECTS,
        semesterECTS: context.semesterECTS,
        responsibleDepartment: context.responsibleDepartment,
        confirmedByResDept: context.confirmedByResDept,
        studentCount: context.studentCount,
        lectureGroup: context.lectureGroup,
        tutorialGroup: context.tutorialGroup,
        totalSmallGroup: context.totalSmallGroup,
        school: context.school,
        totalCoveredLectureHours: totalL,
        totalCoveredTutorialHours: totalT,
        totalCoveredLabHours: totalLab,
        uncoveredHours: totalUncovered,
        lecturesAndTutorialsNo: totalCovered,
      };

      try {
        if (a.workloadId) {
          await workloadsApi.update(a.workloadId, payload);
        } else {
          const res = await workloadsApi.create(payload);
          a.workloadId = res.data?.id;
        }
        successCount++;
      } catch (err: any) {
        errorCount++;
        const msg = err?.response?.data?.message || 'Unknown error';
        toast.error(`Failed to save ${a.firstName} ${a.lastName}: ${msg}`, { duration: 4000 });
      }
    }

    qc.invalidateQueries({ queryKey: ['workloads-all'] });
    qc.invalidateQueries({ queryKey: ['course-assignments', context.courseId, context.semesterId] });
    setAssignments((prev) => prev.map((a) => ({ ...a, isDirty: false })));

    if (successCount > 0) {
      toast.success(`${successCount} assignment(s) saved`);
    }
    if (errorCount === 0) {
      onSaved();
    }
    setSavingAll(false);
  }

  // ── UI ──
  const programStr = context.program.join(', ');
  const groupStr = context.groupCodes.join(', ');

  return (
    <div className="space-y-4">
      {/* Course Info Card */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-primary-800">Course Offering</h3>
          <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
            {semesterName || 'Selected Semester'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-[11px]">
          <div className="bg-white/70 rounded-md px-2 py-1 border border-primary-100">
            <span className="text-gray-400">Code</span>
            <p className="font-semibold text-gray-800">{context.courseCode}</p>
          </div>
          <div className="bg-white/70 rounded-md px-2 py-1 border border-primary-100 col-span-2">
            <span className="text-gray-400">Title</span>
            <p className="font-semibold text-gray-800 truncate">{context.courseTitle}</p>
          </div>
          <div className="bg-white/70 rounded-md px-2 py-1 border border-primary-100">
            <span className="text-gray-400">Program</span>
            <p className="font-semibold text-gray-800 truncate">{programStr || '-'}</p>
          </div>
          <div className="bg-white/70 rounded-md px-2 py-1 border border-primary-100">
            <span className="text-gray-400">Language</span>
            <p className="font-semibold text-gray-800">{context.teachingLanguage?.replace('_', '-') || '-'}</p>
          </div>
          <div className="bg-white/70 rounded-md px-2 py-1 border border-primary-100">
            <span className="text-gray-400">Groups</span>
            <p className="font-semibold text-gray-800 truncate">{groupStr || '-'}</p>
          </div>
        </div>
      </div>

      {/* Main content: Departments + Assignment Matrix */}
      <div className="flex gap-4">
        {/* Left: Department List */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Departments</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Click to view professors</p>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {(!departments || departments.length === 0) && (
                <p className="px-3 py-4 text-xs text-gray-400 text-center">No departments found</p>
              )}
              {departments?.map((dept: any) => {
                const isExpanded = expandedDepts.has(dept.id);
                const isLoading = deptLoading.has(dept.id);
                const professors = deptProfessors[dept.id] || [];
                return (
                  <div key={dept.id} className="border-b border-gray-100 last:border-0">
                    <button
                      type="button"
                      onClick={() => toggleDept(dept.id)}
                      className="w-full flex items-center gap-1.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-primary-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-xs font-medium text-gray-700 truncate">{dept.name}</span>
                      {isLoading && <Loader2 className="w-3 h-3 animate-spin text-primary-400 ml-auto" />}
                    </button>
                    {isExpanded && (
                      <div className="px-2 pb-2">
                        {professors.length === 0 && !isLoading && (
                          <p className="px-5 py-1 text-[10px] text-gray-400">No professors</p>
                        )}
                        {professors.map((prof: any) => {
                          const alreadyAssigned = assignments.some((a) => a.facultyId === prof.id);
                          return (
                            <button
                              key={prof.id}
                              type="button"
                              onClick={() => addFaculty(prof)}
                              disabled={alreadyAssigned}
                              className={`w-full flex items-center gap-2 px-5 py-1.5 text-left text-[11px] rounded-md transition-colors ${
                                alreadyAssigned
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
                              }`}
                            >
                              <UserPlus className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                {prof.firstName} {prof.lastName}
                              </span>
                              {alreadyAssigned && <span className="text-[9px] text-gray-300 ml-auto">Added</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Assignment Matrix */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Matrix Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Faculty Assignments</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Click professor from left panel to add</p>
              </div>
              {caLoading && <Loader2 className="w-4 h-4 animate-spin text-primary-400" />}
            </div>

            {assignments.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <UserPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No faculty assigned yet</p>
                <p className="text-xs text-gray-300 mt-1">Select a department and click a professor to add</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    {/* Faculty names row — vertical text */}
                    <tr className="border-b border-gray-200">
                      <th className="w-12 px-1 py-2 bg-gray-50/50 border-r border-gray-100"></th>
                      {assignments.map((a) => (
                        <th key={a.facultyId} className="px-1 py-2 border-r border-gray-100 min-w-[80px]">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className="text-[10px] font-bold text-gray-600 whitespace-nowrap"
                              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                              title={`${a.firstName} ${a.lastName}${a.departmentName ? ` (${a.departmentName})` : ''}`}
                            >
                              {a.firstName} {a.lastName}
                            </span>
                          </div>
                        </th>
                      ))}
                      {/* Totals column */}
                      <th className="px-2 py-2 bg-blue-50/50 border-l border-blue-100 min-w-[70px]">
                        <span className="text-[10px] font-bold text-blue-700">Total</span>
                      </th>
                      {/* Required column */}
                      <th className="px-2 py-2 bg-green-50/50 border-l border-green-100 min-w-[70px]">
                        <span className="text-[10px] font-bold text-green-700">Required</span>
                      </th>
                      {/* Uncovered column */}
                      <th className="px-2 py-2 bg-amber-50/50 border-l border-amber-100 min-w-[70px]">
                        <span className="text-[10px] font-bold text-amber-700">Uncovered</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px]">
                    {/* Lecture row */}
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-2 bg-gray-50/50 border-r border-gray-100 font-semibold text-gray-500 text-center">L</td>
                      {assignments.map((a, i) => (
                        <td key={a.facultyId} className="px-1 py-1 border-r border-gray-100 text-center relative">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={a.lectureHours || ''}
                            onChange={(e) => updateHours(i, 'lectureHours', e.target.value)}
                            className={`w-full text-center py-1 px-1 text-[11px] rounded border ${
                              a.isDirty ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-white'
                            } focus:outline-none focus:ring-1 focus:ring-primary-500`}
                          />
                          <button
                            type="button"
                            onClick={() => removeFaculty(i)}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                            title="Remove"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </td>
                      ))}
                      <td className="px-2 py-2 bg-blue-50/30 border-l border-blue-100 text-center font-bold text-blue-700">
                        {totalL}
                      </td>
                      <td className="px-2 py-2 bg-green-50/30 border-l border-green-100 text-center font-bold text-green-700">
                        {reqL}
                      </td>
                      <td
                        className={`px-2 py-2 bg-amber-50/30 border-l border-amber-100 text-center font-bold ${
                          uncoveredL < 0 ? 'text-red-600' : uncoveredL > 0 ? 'text-amber-600' : 'text-green-600'
                        }`}
                      >
                        {uncoveredL}
                      </td>
                    </tr>
                    {/* Tutorial row */}
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-2 bg-gray-50/50 border-r border-gray-100 font-semibold text-gray-500 text-center">T</td>
                      {assignments.map((a, i) => (
                        <td key={a.facultyId} className="px-1 py-1 border-r border-gray-100 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={a.seminarHours || ''}
                            onChange={(e) => updateHours(i, 'seminarHours', e.target.value)}
                            className={`w-full text-center py-1 px-1 text-[11px] rounded border ${
                              a.isDirty ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-white'
                            } focus:outline-none focus:ring-1 focus:ring-primary-500`}
                          />
                        </td>
                      ))}
                      <td className="px-2 py-2 bg-blue-50/30 border-l border-blue-100 text-center font-bold text-blue-700">
                        {totalT}
                      </td>
                      <td className="px-2 py-2 bg-green-50/30 border-l border-green-100 text-center font-bold text-green-700">
                        {reqT}
                      </td>
                      <td
                        className={`px-2 py-2 bg-amber-50/30 border-l border-amber-100 text-center font-bold ${
                          uncoveredT < 0 ? 'text-red-600' : uncoveredT > 0 ? 'text-amber-600' : 'text-green-600'
                        }`}
                      >
                        {uncoveredT}
                      </td>
                    </tr>
                    {/* Lab row */}
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-2 bg-gray-50/50 border-r border-gray-100 font-semibold text-gray-500 text-center">Lab</td>
                      {assignments.map((a, i) => (
                        <td key={a.facultyId} className="px-1 py-1 border-r border-gray-100 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={a.labHours || ''}
                            onChange={(e) => updateHours(i, 'labHours', e.target.value)}
                            className={`w-full text-center py-1 px-1 text-[11px] rounded border ${
                              a.isDirty ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-white'
                            } focus:outline-none focus:ring-1 focus:ring-primary-500`}
                          />
                        </td>
                      ))}
                      <td className="px-2 py-2 bg-blue-50/30 border-l border-blue-100 text-center font-bold text-blue-700">
                        {totalLab}
                      </td>
                      <td className="px-2 py-2 bg-green-50/30 border-l border-green-100 text-center font-bold text-green-700">
                        {reqLab}
                      </td>
                      <td
                        className={`px-2 py-2 bg-amber-50/30 border-l border-amber-100 text-center font-bold ${
                          uncoveredLab < 0 ? 'text-red-600' : uncoveredLab > 0 ? 'text-amber-600' : 'text-green-600'
                        }`}
                      >
                        {uncoveredLab}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary Bar */}
            {assignments.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-4 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Total Covered:</span>
                    <span className="font-bold text-blue-700">{totalCovered}h</span>
                    <span className="text-gray-400">/ {totalRequired}h</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Uncovered:</span>
                    <span className={`font-bold ${totalUncovered > 0 ? 'text-amber-600' : totalUncovered < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {totalUncovered}h
                    </span>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2">
                    {hasDirty && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Unsaved changes
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={saveAll}
                      disabled={savingAll || !hasDirty}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {savingAll && <Loader2 className="w-3 h-3 animate-spin" />}
                      <Save className="w-3 h-3" />
                      Save Assignments
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary flex items-center gap-1 py-1.5 text-[11px]"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Create
        </button>
        <button
          type="button"
          onClick={() => {
            setAssignments([]);
            onSaved();
          }}
          className="btn-secondary flex items-center gap-1 py-1.5 text-[11px]"
        >
          Done
        </button>
      </div>
    </div>
  );
}
