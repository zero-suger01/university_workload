import { useState } from 'react';
import { CustomDropdown } from '../../components/shared/CustomDropdown';
import { PageHeader } from '../../components/shared/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cqiApi } from '../../api/cqi.api';
import { useAuthStore } from '../../store/authStore';
import {
  FileCheck, Plus, ChevronRight, ChevronLeft, Save, Send,
  CheckCircle, Clock, AlertCircle,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Clock },
  SUBMITTED: { label: 'Submitted', color: 'bg-primary-100 text-primary-700', icon: Send },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  REVISION_NEEDED: { label: 'Revision Needed', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
};

const STEPS = [
  'Course Info', 'Objectives', 'Evaluation', 'Syllabus',
  'Instructor Eval', 'Student Survey', 'CLO Assessment',
];

const DEFAULT_WEEKS = Array.from({ length: 16 }, (_, i) => ({
  week: i + 1, date: '', topic: '', tutorials: '',
}));

const DEFAULT_CLOS = Array.from({ length: 7 }, (_, i) => ({
  cloNumber: i + 1,
  description: '',
  teachingMethods: ['Lectures', 'Tutorials'],
  assessmentTools: ['Exams', 'Assignments'],
  perfHigh: '70% of students achieved 70%+',
  perfMedium: '70% of students achieved 50%+',
  perfLow: '70% of students achieved 30%+',
  plosHigh: [],
  plosMedium: [],
  plosLow: [],
}));

export default function CQIPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState<any>({
    courseId: '',
    semesterId: '',
    studentCount: 0,
    evalMidterm: 40,
    evalFinal: 40,
    evalAssignment: 20,
    textbooks: [''],
    evalQ1Answer: '',
    evalQ2Answer: '',
    evalQ3Answer: '',
    evalQ4Answer: '',
    surveyParticipation: '',
    surveyFollowsSyllabus: '',
    surveySatisfaction: '',
    surveyAvgScore: '',
    syllabus: DEFAULT_WEEKS,
    cloAssessments: DEFAULT_CLOS,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['cqi', 'my'],
    queryFn: () => cqiApi.getMy().then(r => r.data),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => import('../../api/workload-assignments.api').then(m =>
      m.workloadAssignmentsApi.getByFaculty(user?.id ?? '').then(r => r.data)
    ),
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editId ? cqiApi.update(editId, data) : cqiApi.create(data),
    onSuccess: () => { toast.success('CQI report saved'); qc.invalidateQueries({ queryKey: ['cqi'] }); setCreating(false); setEditId(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error saving CQI'),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => cqiApi.submit(id),
    onSuccess: () => { toast.success('CQI report submitted'); qc.invalidateQueries({ queryKey: ['cqi'] }); },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit CQI report');
    },
  });

  // unique courses from assignments
  const myCourses = Array.from(
    new Map(assignments.map((a: any) => [a.planningRow?.course?.id, a.planningRow?.course])).values()
  ).filter(Boolean);

  const mySemesters = Array.from(
    new Map(assignments.map((a: any) => [a.planningRow?.semester?.id, a.planningRow?.semester])).values()
  ).filter(Boolean);

  function openCreate() {
    setForm({
      courseId: '', semesterId: '', studentCount: 0,
      evalMidterm: 40, evalFinal: 40, evalAssignment: 20,
      textbooks: [''], evalQ1Answer: '', evalQ2Answer: '', evalQ3Answer: '', evalQ4Answer: '',
      surveyParticipation: '', surveyFollowsSyllabus: '', surveySatisfaction: '', surveyAvgScore: '',
      syllabus: DEFAULT_WEEKS, cloAssessments: DEFAULT_CLOS,
    });
    setStep(0); setEditId(null); setCreating(true);
  }

  function openEdit(r: any) {
    setForm({
      courseId: r.courseId, semesterId: r.semesterId, studentCount: r.studentCount,
      evalMidterm: r.evalMidterm, evalFinal: r.evalFinal, evalAssignment: r.evalAssignment,
      textbooks: r.textbooks?.length ? r.textbooks : [''],
      evalQ1Answer: r.evalQ1Answer ?? '', evalQ2Answer: r.evalQ2Answer ?? '',
      evalQ3Answer: r.evalQ3Answer ?? '', evalQ4Answer: r.evalQ4Answer ?? '',
      surveyParticipation: r.surveyParticipation ?? '',
      surveyFollowsSyllabus: r.surveyFollowsSyllabus ?? '',
      surveySatisfaction: r.surveySatisfaction ?? '',
      surveyAvgScore: r.surveyAvgScore ?? '',
      syllabus: r.syllabus?.length ? r.syllabus : DEFAULT_WEEKS,
      cloAssessments: r.cloAssessments?.length ? r.cloAssessments : DEFAULT_CLOS,
    });
    setStep(0); setEditId(r.id); setCreating(true);
  }

  function handleSave() {
    const payload = {
      ...form,
      studentCount: Number(form.studentCount),
      evalMidterm: Number(form.evalMidterm),
      evalFinal: Number(form.evalFinal),
      evalAssignment: Number(form.evalAssignment),
      surveyParticipation: form.surveyParticipation !== '' ? Number(form.surveyParticipation) : undefined,
      surveyFollowsSyllabus: form.surveyFollowsSyllabus !== '' ? Number(form.surveyFollowsSyllabus) : undefined,
      surveySatisfaction: form.surveySatisfaction !== '' ? Number(form.surveySatisfaction) : undefined,
      surveyAvgScore: form.surveyAvgScore !== '' ? Number(form.surveyAvgScore) : undefined,
      textbooks: form.textbooks.filter((t: string) => t.trim()),
    };
    saveMutation.mutate(payload);
  }

  if (creating) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setCreating(false)} className="text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">{editId ? 'Edit' : 'New'} CQI Report</h1>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <button
                onClick={() => setStep(i)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  i === step ? 'bg-primary-600 text-white' :
                  i < step ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {i < step ? <CheckCircle className="w-3 h-3" /> : <span>{i + 1}</span>}
                {s}
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="mb-6">
          {step === 0 && (
            <Step1 form={form} setForm={setForm} courses={myCourses} semesters={mySemesters} />
          )}
          {step === 1 && <Step2 form={form} setForm={setForm} />}
          {step === 2 && <Step3 form={form} setForm={setForm} />}
          {step === 3 && <Step4 form={form} setForm={setForm} />}
          {step === 4 && <Step5 form={form} setForm={setForm} />}
          {step === 5 && <Step6 form={form} setForm={setForm} />}
          {step === 6 && <Step7 form={form} setForm={setForm} />}
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save Draft'}
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
              >
                <Save className="w-4 h-4" /> Finish & Save
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4 gap-4">
        <PageHeader icon={<FileCheck />} title="CQI Reports" subtitle="Continuous Quality Improvement Reports" />
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" /> New CQI Report
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No CQI reports yet</p>
          <p className="text-sm">Create your first CQI report for a course</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((r: any) => {
            const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.DRAFT;
            const Icon = cfg.icon;
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {r.course?.courseCode} — {r.course?.title}
                      </span>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {r.semester?.name} · {r.studentCount} students
                    </div>
                    {r.reviewNotes && (
                      <div className="mt-2 text-sm text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg">
                        <span className="font-medium">Reviewer note:</span> {r.reviewNotes}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {r.status === 'DRAFT' && (
                      <>
                        <button
                          onClick={() => openEdit(r)}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { if (confirm('Submit this CQI report?')) submitMutation.mutate(r.id); }}
                          className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          Submit
                        </button>
                      </>
                    )}
                    {r.status === 'REVISION_NEEDED' && (
                      <button
                        onClick={() => openEdit(r)}
                        className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Revise
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Step Components ───────────────────────────────────────────────────────────

function Step1({ form, setForm, courses, semesters }: any) {
  return (
    <div className="bg-gray-50/60 rounded-xl p-5">
      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-primary-500 rounded-full" />
        Course Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Course <span className="text-red-400">*</span></label>
          <CustomDropdown
            value={form.courseId}
            options={courses.map((c: any) => ({ value: c.id, label: `${c.courseCode} — ${c.title}` }))}
            onChange={(val) => setForm((f: any) => ({ ...f, courseId: val }))}
            placeholder="Select course..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Semester <span className="text-red-400">*</span></label>
          <CustomDropdown
            value={form.semesterId}
            options={semesters.map((s: any) => ({ value: s.id, label: s.name }))}
            onChange={(val) => setForm((f: any) => ({ ...f, semesterId: val }))}
            placeholder="Select semester..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Number of Students</label>
          <input type="number" value={form.studentCount}
            onChange={e => setForm((f: any) => ({ ...f, studentCount: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" min={0} />
        </div>
      </div>
    </div>
  );
}

function Step2({ form, setForm }: any) {
  const updateCLO = (i: number, _field: string, val: string) => {
    const clos = [...form.cloAssessments];
    clos[i] = { ...clos[i], description: val };
    setForm((f: any) => ({ ...f, cloAssessments: clos }));
  };
  return (
    <div className="bg-gray-50/60 rounded-xl p-5">
      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-primary-500 rounded-full" />
        Course Learning Objectives
      </h3>
      <p className="text-xs text-gray-500 mb-4">Define what students will be able to do after completing this course.</p>
      <div className="space-y-3">
        {form.cloAssessments.map((clo: any, i: number) => (
          <div key={i} className="flex gap-3">
            <span className="flex-shrink-0 w-12 h-9 flex items-center justify-center bg-primary-50 text-primary-700 text-sm font-bold rounded-lg">
              CO {i + 1}
            </span>
            <input
              type="text"
              value={clo.description}
              onChange={e => updateCLO(i, 'description', e.target.value)}
              placeholder={`Course objective ${i + 1}...`}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Step3({ form, setForm }: any) {
  const total = Number(form.evalMidterm) + Number(form.evalFinal) + Number(form.evalAssignment);
  return (
    <div className="space-y-4">
      {/* ── Section: Evaluation Breakdown ── */}
      <div className="bg-gray-50/60 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-primary-500 rounded-full" />
          Evaluation Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Midterm Exam %', key: 'evalMidterm' },
            { label: 'Final Exam %', key: 'evalFinal' },
            { label: 'Assignments %', key: 'evalAssignment' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <input type="number" value={form[key]} min={0} max={100}
                onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          ))}
        </div>
        <div className={`mt-3 text-sm font-medium ${total === 100 ? 'text-green-600' : 'text-red-600'}`}>
          Total: {total}% {total !== 100 ? '(must equal 100%)' : '✓'}
        </div>
      </div>

      {/* ── Section: Textbooks & References ── */}
      <div className="bg-gray-50/60 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-primary-500 rounded-full" />
          Textbooks & References
        </h3>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Add textbooks or reference materials</span>
            <button onClick={() => setForm((f: any) => ({ ...f, textbooks: [...f.textbooks, ''] }))}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium">+ Add</button>
          </div>
          {form.textbooks.map((tb: string, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" value={tb}
                onChange={e => {
                  const tbs = [...form.textbooks];
                  tbs[i] = e.target.value;
                  setForm((f: any) => ({ ...f, textbooks: tbs }));
                }}
                placeholder="Textbook title, author, year..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              {form.textbooks.length > 1 && (
                <button onClick={() => setForm((f: any) => ({ ...f, textbooks: f.textbooks.filter((_: any, j: number) => j !== i) }))}
                  className="text-red-500 hover:text-red-700 px-2">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4({ form, setForm }: any) {
  const update = (i: number, field: string, val: string) => {
    const syl = [...form.syllabus];
    syl[i] = { ...syl[i], [field]: val };
    setForm((f: any) => ({ ...f, syllabus: syl }));
  };
  return (
    <div className="bg-gray-50/60 rounded-xl p-5">
      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-primary-500 rounded-full" />
        16-Week Syllabus
      </h3>
      <div className="overflow-auto max-h-[480px] rounded-lg border border-gray-200">
        <table className="w-full border-collapse border border-gray-200">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200 w-12">Week</th>
              <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200 w-24">Date</th>
              <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Topics & Learning Activities</th>
              <th className="px-2 py-2.5 text-center font-bold text-gray-500 uppercase text-[9px] whitespace-nowrap border-r border-gray-200">Tutorials & Assignments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {form.syllabus.map((row: any, i: number) => (
              <tr key={i} className={`border-b border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">{row.week}</td>
                <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                  <input type="text" value={row.date} onChange={e => update(i, 'date', e.target.value)}
                    className="w-full text-xs px-1 py-0.5 border-0 bg-transparent focus:outline-none text-center" placeholder="dd.mm" />
                </td>
                <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                  <input type="text" value={row.topic} onChange={e => update(i, 'topic', e.target.value)}
                    className="w-full text-xs px-1 py-0.5 border-0 bg-transparent focus:outline-none text-center" placeholder="Topic..." />
                </td>
                <td className="px-2 py-2 text-center text-[11px] text-gray-700 whitespace-nowrap border-r border-gray-200">
                  <input type="text" value={row.tutorials} onChange={e => update(i, 'tutorials', e.target.value)}
                    className="w-full text-xs px-1 py-0.5 border-0 bg-transparent focus:outline-none text-center" placeholder="Assignment..." />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Step5({ form, setForm }: any) {
  const questions = [
    { key: 'evalQ1Answer', q: 'Are the course processes appropriate?' },
    { key: 'evalQ2Answer', q: 'Do the course outcomes lend themselves to assessment?' },
    { key: 'evalQ3Answer', q: 'Is the designated workload of this course appropriate? How do you know?' },
    { key: 'evalQ4Answer', q: 'Recommendation for Improvement' },
  ];
  return (
    <div className="bg-gray-50/60 rounded-xl p-5">
      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-primary-500 rounded-full" />
        Instructor Evaluation (Section E)
      </h3>
      <div className="space-y-4">
        {questions.map(({ key, q }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-500 mb-1">{q}</label>
            <textarea value={form[key]} rows={3}
              onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Step6({ form, setForm }: any) {
  return (
    <div className="bg-gray-50/60 rounded-xl p-5">
      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-primary-500 rounded-full" />
        Student Survey (Section F)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {[
          { label: 'Survey Participation (students)', key: 'surveyParticipation' },
          { label: 'Professor follows Syllabus (%)', key: 'surveyFollowsSyllabus' },
          { label: 'Overall Satisfaction (%)', key: 'surveySatisfaction' },
          { label: 'Average Score (%)', key: 'surveyAvgScore' },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <input type="number" value={form[key]}
              onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Step7({ form, setForm }: any) {
  const update = (i: number, field: string, val: any) => {
    const clos = [...form.cloAssessments];
    clos[i] = { ...clos[i], [field]: val };
    setForm((f: any) => ({ ...f, cloAssessments: clos }));
  };
  return (
    <div className="bg-gray-50/60 rounded-xl p-5">
      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-primary-500 rounded-full" />
        CLO Assessment Plan (Section G)
      </h3>
      <div className="space-y-4 max-h-[480px] overflow-auto">
        {form.cloAssessments.map((clo: any, i: number) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="font-medium text-primary-700 mb-3 text-sm">CLO {clo.cloNumber}: {clo.description || '(no description)'}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Teaching Methods <span className="text-[10px] text-gray-400">(comma-separated)</span></label>
                <input type="text" value={clo.teachingMethods?.join(', ')}
                  onChange={e => update(i, 'teachingMethods', e.target.value.split(',').map((s: string) => s.trim()))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Assessment Tools <span className="text-[10px] text-gray-400">(comma-separated)</span></label>
                <input type="text" value={clo.assessmentTools?.join(', ')}
                  onChange={e => update(i, 'assessmentTools', e.target.value.split(',').map((s: string) => s.trim()))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">PLOs (High) <span className="text-[10px] text-gray-400">(comma-separated)</span></label>
                <input type="text" value={clo.plosHigh?.join(', ')}
                  onChange={e => update(i, 'plosHigh', e.target.value.split(',').map((s: string) => s.trim()))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">PLOs (Medium) <span className="text-[10px] text-gray-400">(comma-separated)</span></label>
                <input type="text" value={clo.plosMedium?.join(', ')}
                  onChange={e => update(i, 'plosMedium', e.target.value.split(',').map((s: string) => s.trim()))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
