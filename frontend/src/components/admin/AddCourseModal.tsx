import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Loader2, BookOpen } from 'lucide-react';
import api from '../../api/client';
import BaseModal from '../shared/BaseModal';
import { CustomDropdown } from '../../components/shared/CustomDropdown';

const SUBJECT_BOARDS = [
  'AI & Robotics',
  'Computer Science',
  'Education',
  'Cybersecurity',
  'Design',
  'Economics',
  'Humanities and Social Sciences',
  'Internship',
  'Math',
  'Old Freshmen',
  'Physics',
  'Graduation Project/thesis',
];

const COURSE_TITLES = [
  'Deep Learning',
  'Robotics',
  'Reinforcement Learning',
  'Introduction to Robotics and Artificial Intelligence',
  'Engineering Mechanics',
  'Control Systems',
  'Electronic Devices and Circuits',
  'Robotic Product Design and Innovation',
  'Robotic Systems and Simulations',
  'Microcontrollers',
  'Computer Aided Design',
  'Embedded Systems',
  'Natural Language Processing',
  'Technical elective',
  'IT and Soft Skills',
  'Information Systems and Digital Technologies',
  'Introduction to Programming 2',
  'Introduction to Programming',
  'Algorithms & Data Structures',
  'Competitive Algorithm Programming',
  'Computer Programming 1',
  'Computer Programming 2',
  'Basic Concepts of Computer Science',
  'Data Analysis & Design',
  'Introduction to Computer Science',
  'Software Engineering',
  'Object Oriented Programming',
  'Design & Analysis of Algorithms',
  'Rapid Application Development',
  'Computer Architecture',
  'Introduction to Data Science',
  'Data Science Fundamentals',
  'Fundamentals of Databases',
  'Operating Systems',
  'Computer Networks',
  'Theory of Computation',
  'Introduction to Machine Learning',
  'Functional Programming',
  'Signals & Systems',
  'Fundamentals of Software Engineering',
  'Software Development',
  'Software Quality Engineering',
  'Software Project Management',
  'Computer Science Education',
  'Management Information Systems',
  'Introduction to Programming 1',
  'Languages & Compilers',
  'Artificial Intelligence',
  'Big Data',
  'Distributed Systems',
  'Digital Logic Design',
  'Mathematical Foundations of Machine Learning',
  'Image Processing',
  'Computer Vision',
  'Web Technologies',
  'Data Mining & Visualization',
  'System Administration & Cloud Services',
  'Cybersecurity & Digital Forensics',
  'Web Programming',
  'Mobile Programming',
  'Game Development',
  'Cloud Computing',
  'Free elective',
  'Cybercrime and Digital Forensics',
  'Computer Security',
  'Network Security',
  'Ethical Hacking and Penetration Testing',
  'Internet of Things and Cyber Security',
  'Secure Software Design and Development',
  'Computer Networks and Security',
  'Interaction Design',
  'Product Design',
  'Industrial Design',
  'Critical-creative thinking and design',
  'Introduction to Economics',
  'Microeconomics 1',
  'Introduction to Microeconomics',
  'Introduction to Macroeconomics',
  'Macroeconomics 1',
  'Microeconomics 2',
  'Macroeconomics 2',
  'Energy Environmental Economics',
  'Contemporary issues in Economics',
  'Economic and Social Statistics',
  'Econometrics',
  'International Trade',
  'Money and Banking',
  'Game Theory for Economics',
  'Circular Economy',
  'Research Methods in Economics',
  'Research project 1 (Capstone)',
  'Research project 2 (Capstone)',
  'Development Economics',
  'Behavioral Economics',
  'Economic Policy',
  'Mathematical methods for Economic analysis',
  'Time Series Analysis',
  'Introduction to Teaching and Learning',
  'Classroom Management',
  'Assessment and Evaluation in Education',
  'Curriculum Development & Instruction',
  'Educational Psychology',
  'Global Citizenship',
  'Inclusive Education and Pedagogy of Care',
  'Uzbek/Russian for Academic and Professional Purposes',
  'Pedagogical Internship 1',
  'Introduction to Teaching Math',
  'Teaching Methodology',
  'Introduction to Teaching Technology',
  'Education, Society and Culture',
  'Coding for Educators',
  'Interdisciplinary Language, Literacies and Digital Media',
  'Research Methodology',
  'Foundations of AI Literacy',
  'Pedagogical Internship 2',
  'Real-World Learning, Project, Case and Problem-based Learning',
  'Game-based Learning and Gamification for the Classroom',
  'Professional Ethics and Legal Issues in Education',
  'Reflective Practice',
  'Teaching, Technology and AI Pedagogies',
  'Professional Development and Leadership in Education',
  'Graduation Project',
  'Digital Media and Technology in Education',
  'Foundations of Research Proposal Writing',
  'Pedagogical Internship 3',
  'Pedagogical Internship 4',
  'Academic and Communication Skills',
  'General English 1',
  'General English 2',
  'Academic English',
  'Expository Writing',
  'Scientific Communication and Visualization',
  'Technical Writing and Academic Literacy',
  'Uzbekistan History in an International Context',
  'Digital Diplomacy',
  'First Principles of NewUU',
  'History of Uzbekistan',
  'History of Sciences and Industry',
  'Introduction to Social Sciences',
  'Communications Ethics',
  'Philosophy',
  'Reforms of New Uzbekistan',
  'German Language',
  'Korean Language',
  'Mathematics Education',
  'Statistical Methods',
  'Analytical Geometry',
  'Precalculus',
  'Calculus 1',
  'Calculus 2',
  'Analysis 1',
  'Analysis 2',
  'Analysis 3',
  'Analysis 4',
  'Discrete Mathematics',
  'Linear Algebra 1',
  'Probability and Statistics',
  'Optimization Theory',
  'Calculus of variations and optimization',
  'Ordinary Differential Equations and Numerical Methods',
  'Numerical Methods for Engineers',
  'Game Theory',
  'Abstract Algebra',
  'Complex Analysis',
  'Functional Analysis',
  'Real Analysis',
  'Operation Research',
  'Partial Differential Equations',
  'Topology',
  'Numerical Analysis',
  'Advanced Probability Theory and Statistics',
  'Linear Algebra 2',
  'Introduction to Number Theory and Cryptography',
  'Foundations of Geometry',
  'Introduction to Differential Geometry',
  'Combinatorial Analysis',
  'Basic Algebraic Geometry',
  'Stochastic Processes',
  'Composing Scientific Texts',
  'Financial Literacy',
  'Economics of Innovation and Technology',
  'Optimization and Game Theory',
  'Econometric Theory and Practice',
  'Machine Learning for Economists',
  'Learning & Teaching in Educational Concept',
  'Design of Learning Environments',
  'Social and Communication Psychology',
  'Computer Literacy',
  'Academic English 1',
  'Academic English 2',
  'Themes in Social Science',
  'Business Studies',
  'Mathematics',
  'Calculus',
  'Practical Statistics',
  'Statistical Methods & Applications',
  'Discrete Probability Theory',
  'Probability Models',
  'Discrete Mathematics 2',
  'Differential Equations',
  'Physics',
  'Physics II',
  'Physics Experiments 2',
  'Basics of Thermodynamics',
  'Physics 1',
  'Physics 2',
  'Engineering Thermodynamics',
  'Solid State Physics',
  'Graduation Project 1 / Internship 1',
  'Graduation Project 2 / Internship 2',
];

const SEMESTER_OPTIONS = ['Fall Semester', 'Spring Semester', 'Summer Retake'];
const DEGREE_OPTIONS = ['Undergraduate', 'Graduate'];
const PART_OF_TERM_OPTIONS = ['Part-term', 'Full term'];
const FORMAT_OPTIONS = ['Online', 'On-campus'];
const COURSE_TYPES = ['LECTURE', 'SEMINAR', 'LAB', 'BOTH'];

const schema = z.object({
  subjectBoard: z.string().min(1, 'Subject board is required'),
  title: z.string().min(1, 'Course title is required'),
  courseCode: z.string().min(1, 'Course code is required').max(20).toUpperCase(),
  prerequisites: z.string().optional(),
  weeklyLectureHours: z.number().nonnegative().default(0),
  weeklyTutorialHours: z.number().nonnegative().default(0),
  weeklyLabHours: z.number().nonnegative().default(0),
  semesterOffered: z.string().optional(),
  ectsCredits: z.number().positive().optional().or(z.literal('')),
  usCreditHours: z.number().positive().optional().or(z.literal('')),
  departmentId: z.string().min(1, 'Department is required'),
  degreeLevel: z.string().optional(),
  description: z.string().optional(),
  textbook: z.string().optional(),
  learningOutcome1: z.string().optional(),
  learningOutcome2: z.string().optional(),
  learningOutcome3: z.string().optional(),
  learningOutcome4: z.string().optional(),
  learningOutcome5: z.string().optional(),
  learningOutcome6: z.string().optional(),
  learningOutcome7: z.string().optional(),
  learningOutcome8: z.string().optional(),
  learningOutcome9: z.string().optional(),
  learningOutcome10: z.string().optional(),
  learningOutcome11: z.string().optional(),
  learningOutcome12: z.string().optional(),
  learningOutcome13: z.string().optional(),
  learningOutcome14: z.string().optional(),
  accreditationArea: z.string().optional(),
  partOfTerm: z.string().optional(),
  format: z.string().optional(),
  gradeStatus: z.string().optional(),
  maxStudents: z.number().int().positive().optional().or(z.literal('')),
  seatsAvailable: z.number().int().nonnegative().optional().or(z.literal('')),
  waitlistTotal: z.number().int().nonnegative().optional().or(z.literal('')),
  lastDayToRegister: z.string().optional(),
  lastDayToAddDrop: z.string().optional(),
  instructorInfo: z.string().optional(),
  meetingInfo: z.string().optional(),
  notes: z.string().optional(),
  type: z.enum(['LECTURE', 'SEMINAR', 'LAB', 'BOTH']).default('LECTURE'),
  creditUnits: z.number().nonnegative().optional().default(3),
});

type FormData = z.infer<typeof schema>;

interface AddCourseModalProps {
  onClose: () => void;
}

const inputCls = 'w-full px-2 py-1 text-[11px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 h-7';
const labelCls = 'block text-[10px] font-medium text-gray-500 mb-0 leading-none';
const errorCls = 'text-xs text-red-500 mt-1';

export default function AddCourseModal({ onClose }: AddCourseModalProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: departments, isLoading: loadingDepts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then((r) => r.data.data),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'LECTURE',
      creditUnits: 3,
      weeklyLectureHours: 0,
      weeklyTutorialHours: 0,
      weeklyLabHours: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      );
      return api.post('/courses', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success(t('courseAddedSuccessfully') || 'Course added successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add course');
    },
  });

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2 mt-6 mb-4">
      {children}
    </h3>
  );

  return (
    <BaseModal title={t('addCourse') || 'Add Course'} onClose={onClose} maxWidth="max-w-[95vw]">
      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="space-y-2 max-h-[80vh] overflow-y-auto pr-1"
      >
        {/* All fields in a single 7-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '8px' }}>
          {/* Row 1 */}
          <div>
            <label className={labelCls}>Subject Board *</label>
            <CustomDropdown value={watch('subjectBoard') || ''} options={SUBJECT_BOARDS} onChange={(val) => setValue('subjectBoard', val, { shouldValidate: true })} className={inputCls} />
            {errors.subjectBoard && <p className={errorCls}>{errors.subjectBoard.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Course Title *</label>
            <CustomDropdown value={watch('title') || ''} options={COURSE_TITLES} onChange={(val) => setValue('title', val, { shouldValidate: true })} className={inputCls} />
            {errors.title && <p className={errorCls}>{errors.title.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Course Code *</label>
            <input {...register('courseCode')} className={inputCls} placeholder="CS101" />
            {errors.courseCode && <p className={errorCls}>{errors.courseCode.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Course Type</label>
            <CustomDropdown value={watch('type') || ''} options={COURSE_TYPES} onChange={(val) => setValue('type', val as FormData['type'], { shouldValidate: true })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Semester</label>
            <CustomDropdown value={watch('semesterOffered') || ''} options={SEMESTER_OPTIONS} onChange={(val) => setValue('semesterOffered', val, { shouldValidate: true })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Prerequisite</label>
            {watch('prerequisites') && watch('prerequisites') !== 'None' && watch('prerequisites') !== '' ? (
              <div className="flex gap-1">
                <input
                  value={watch('prerequisites') || ''}
                  onChange={e => setValue('prerequisites', e.target.value)}
                  className={inputCls}
                  placeholder="Enter prerequisite…"
                />
                <button type="button" onClick={() => setValue('prerequisites', '')}
                  className="text-gray-400 hover:text-gray-600 text-xs px-1">✕</button>
              </div>
            ) : (
              <select
                value={watch('prerequisites') || ''}
                onChange={e => setValue('prerequisites', e.target.value === '__other__' ? ' ' : e.target.value)}
                className={inputCls}
              >
                <option value="">Select...</option>
                <option value="None">None</option>
                <option value="__other__">+ Other (custom)...</option>
              </select>
            )}
          </div>
          {/* Row 2 */}
          <div>
            <label className={labelCls}>Responsible Department *</label>
            <CustomDropdown value={watch('departmentId') || ''} options={[...(departments ?? [])].sort((a: any, b: any) => a.name.localeCompare(b.name)).map((d: any) => ({ value: d.id, label: d.name }))} onChange={(val) => setValue('departmentId', val, { shouldValidate: true })} className={inputCls} disabled={loadingDepts} />
            {errors.departmentId && <p className={errorCls}>{errors.departmentId.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Lecture Hours</label>
            <input {...register('weeklyLectureHours', { valueAsNumber: true })} type="number" min="0" step="0.5" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tutorial Hours</label>
            <input {...register('weeklyTutorialHours', { valueAsNumber: true })} type="number" min="0" step="0.5" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Lab Hours</label>
            <input {...register('weeklyLabHours', { valueAsNumber: true })} type="number" min="0" step="0.5" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ECTS Credit</label>
            <input {...register('ectsCredits', { valueAsNumber: true })} type="number" min="0" step="0.5" className={inputCls} placeholder="6" />
          </div>
          <div>
            <label className={labelCls}>US Credit</label>
            <input {...register('usCreditHours', { valueAsNumber: true })} type="number" min="0" step="0.5" className={inputCls} placeholder="3" />
          </div>
          <div>
            <label className={labelCls}>Degree</label>
            <CustomDropdown value={watch('degreeLevel') || ''} options={DEGREE_OPTIONS} onChange={(val) => setValue('degreeLevel', val, { shouldValidate: true })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>New Description</label>
            <input {...register('description')} className={inputCls} placeholder="Description…" />
          </div>
          {/* Row 3 */}
          <div>
            <label className={labelCls}>Textbook</label>
            <input {...register('textbook')} className={inputCls} placeholder="Textbook…" />
          </div>
          <div>
            <label className={labelCls}>Syllabus Template</label>
            <input {...register('notes')} className={inputCls} placeholder="Syllabus…" />
          </div>
          <div>
            <label className={labelCls}>Accreditation subject area</label>
            <input {...register('accreditationArea')} className={inputCls} placeholder="e.g. ACM, ABET…" />
          </div>
          <div>
            <label className={labelCls}>Term</label>
            <input {...register('gradeStatus')} className={inputCls} placeholder="Term…" />
          </div>
          <div>
            <label className={labelCls}>Part of Term</label>
            <CustomDropdown value={watch('partOfTerm') || ''} options={PART_OF_TERM_OPTIONS} onChange={(val) => setValue('partOfTerm', val, { shouldValidate: true })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Format</label>
            <CustomDropdown value={watch('format') || ''} options={FORMAT_OPTIONS} onChange={(val) => setValue('format', val, { shouldValidate: true })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Grade Status</label>
            <input {...register('gradeStatus')} className={inputCls} placeholder="GPA" />
          </div>
          {/* Row 4 */}
          <div>
            <label className={labelCls}>Maximum Enrollment</label>
            <input {...register('maxStudents', { valueAsNumber: true })} type="number" min="0" className={inputCls} placeholder="40" />
          </div>
          <div>
            <label className={labelCls}>Seats Available</label>
            <input {...register('seatsAvailable', { valueAsNumber: true })} type="number" min="0" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Waitlist Total</label>
            <input {...register('waitlistTotal', { valueAsNumber: true })} type="number" min="0" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Last day to register</label>
            <input {...register('lastDayToRegister')} type="date" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Last date to add/drop</label>
            <input {...register('lastDayToAddDrop')} type="date" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Instructor Info</label>
            <input {...register('instructorInfo')} className={inputCls} placeholder="Name, email…" />
          </div>
          <div>
            <label className={labelCls}>Meeting Info</label>
            <input {...register('meetingInfo')} className={inputCls} placeholder="Room, time…" />
          </div>
        </div>

        {/* Learning Outcomes — 7 per row */}
        <SectionTitle>Learning Outcomes</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '8px' }}>
          {Array.from({ length: 14 }, (_, i) => {
            const num = i + 1;
            const fieldName = `learningOutcome${num}` as keyof FormData;
            return (
              <div key={num}>
                <label className={labelCls}>Outcome {num}</label>
                <input {...register(fieldName)} className={inputCls} placeholder={`Outcome ${num}…`} />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 pb-2 sticky bottom-0 bg-white">
          <button type="button" onClick={onClose} className="btn-secondary">{t('cancel') || 'Cancel'}</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            <BookOpen size={16} />
            {mutation.isPending ? (t('saving') || 'Saving…') : (t('save') || 'Save Course')}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
