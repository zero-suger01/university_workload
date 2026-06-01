import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '../../api/client';
import BaseModal from '../shared/BaseModal';
import { CustomDropdown } from '../../components/shared/CustomDropdown';
import { CustomDeptDropdown } from '../../components/shared/CustomDeptDropdown';

const ACADEMIC_POSITIONS = [
  { value: 'DEAN',                       label: 'Dean' },
  { value: 'DIRECTOR',                   label: 'Director' },
  { value: 'ASSOCIATE_DIRECTOR',         label: 'Associate Director' },
  { value: 'HEAD_OF_DEPARTMENT',         label: 'Head of Department' },
  { value: 'ASSOCIATE_DEAN',             label: 'Associate Dean' },
  { value: 'ASSISTANT_DEAN',             label: 'Assistant Dean' },
  { value: 'PROFESSOR',                  label: 'Professor' },
  { value: 'ASSOCIATE_PROFESSOR',        label: 'Associate Professor' },
  { value: 'ASSISTANT_PROFESSOR',        label: 'Assistant Professor' },
  { value: 'PROFESSOR_IN_PRACTICE',      label: 'Professor in Practice' },
  { value: 'VISITING_FULLTIME_PROFESSOR',   label: 'Visiting Full-time Professor' },
  { value: 'VISITING_ASSOCIATE_PROFESSOR',  label: 'Visiting Associate Professor' },
  { value: 'VISITING_PROFESSOR',         label: 'Visiting Professor' },
  { value: 'ADJUNCT_PROFESSOR',          label: 'Adjunct Professor' },
  { value: 'SENIOR_LECTURER',            label: 'Senior Lecturer' },
  { value: 'LECTURER',                   label: 'Lecturer' },
  { value: 'TEACHING_ASSISTANT',         label: 'Teaching Assistant' },
  { value: 'LAB_ASSISTANT',              label: 'Lab Assistant' },
  { value: 'POSTDOC',                    label: 'Postdoc' },
] as const;

const DEPARTMENTS = [
  'General Education',
  'English',
  'Mathematics',
  'Computer Science',
  'Education',
  'Pre-primary education',
  'Primary education',
  'Chemistry',
  'Biology',
  'Physics',
  'Geography',
] as const;

const schema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  departmentId: z.string().optional(),
  facultyDepartment: z.string().min(1, 'Department is required'),
  role: z.enum(['ADMIN', 'DEPARTMENT_HEAD', 'FACULTY']),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  academicPosition: z.enum([
    'TEACHING_ASSISTANT', 'LAB_ASSISTANT', 'LECTURER', 'SENIOR_LECTURER',
    'ASSISTANT_PROFESSOR', 'ASSOCIATE_PROFESSOR', 'PROFESSOR', 'PROFESSOR_IN_PRACTICE',
    'VISITING_PROFESSOR', 'VISITING_FULLTIME_PROFESSOR', 'VISITING_ASSOCIATE_PROFESSOR',
    'ADJUNCT_PROFESSOR', 'HEAD_OF_DEPARTMENT', 'ASSOCIATE_DEAN', 'ASSISTANT_DEAN',
    'DEAN', 'DIRECTOR', 'ASSOCIATE_DIRECTOR', 'POSTDOC',
  ]).optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME']).optional(),
  programId: z.string().optional(),
  maxWeeklyHours: z.number().int().min(1).max(80),
  minWeeklyHours: z.number().int().min(0).max(40),
});

type FormData = z.infer<typeof schema>;

interface Faculty {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  maxWeeklyHours: number;
  minWeeklyHours?: number;
  gender?: string | null;
  academicPosition?: string | null;
  employmentType?: string | null;
  programId?: string | null;
  program?: { id: string; name: string; code?: string; departmentId?: string } | null;
  department: { id: string; name: string };
}

interface EditFacultyModalProps {
  faculty: Faculty;
  onClose: () => void;
}

export default function EditFacultyModal({ faculty, onClose }: EditFacultyModalProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  useQuery({
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
      employeeId: faculty.employeeId,
      firstName: faculty.firstName,
      lastName: faculty.lastName,
      email: faculty.email,
      departmentId: faculty.department?.id,
      facultyDepartment: (faculty as any).facultyDepartment || faculty.department?.name || '',
      role: faculty.role as any,
      gender: faculty.gender as 'MALE' | 'FEMALE' | undefined,
      academicPosition: faculty.academicPosition as any,
      employmentType: faculty.employmentType as 'FULL_TIME' | 'PART_TIME' | undefined,
      programId: faculty.programId ?? '',
      maxWeeklyHours: faculty.maxWeeklyHours,
      minWeeklyHours: faculty.minWeeklyHours ?? 0,
    },
  });

  const facultyDeptValue = watch('facultyDepartment') || '';

  const [customDepts, setCustomDepts] = useState<string[]>(() => {
    const current = (faculty as any).facultyDepartment || '';
    return current && !DEPARTMENTS.includes(current) ? [current] : [];
  });
  const allDepts = [...DEPARTMENTS, ...customDepts];
  const [isCustomDept, setIsCustomDept] = useState(() => {
    const current = (faculty as any).facultyDepartment || '';
    return current !== '' && !DEPARTMENTS.includes(current) && !customDepts.includes(current);
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: Record<string, unknown> = { ...data };
      if (!payload.password) delete payload.password;
      if (!payload.departmentId) delete payload.departmentId;
      if (!payload.gender) delete payload.gender;
      if (!payload.academicPosition) delete payload.academicPosition;
      if (!payload.employmentType) delete payload.employmentType;
      if (!payload.programId) delete payload.programId;
      return api.put(`/users/${faculty.id}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Faculty updated successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update faculty');
    },
  });

  const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
      <span className="w-1 h-4 bg-primary-500 rounded-full" />
      {title}
    </h3>
  );

  return (
    <BaseModal title={`Edit — ${faculty.firstName} ${faculty.lastName}`} onClose={onClose}>
      <form onSubmit={handleSubmit((data: FormData) => mutation.mutate(data))} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {/* ── Section: Basic Info ── */}
        <div className="bg-gray-50/60 rounded-xl p-5">
          <SectionHeader title="Basic Info" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t('employeeId')} <span className="text-red-400">*</span>
              </label>
              <input {...register('employeeId')} className="input" />
              {errors.employeeId && <p className="text-xs text-red-500 mt-1">{errors.employeeId.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('academicPosition')}</label>
              <CustomDropdown
                value={watch('academicPosition') || ''}
                options={ACADEMIC_POSITIONS.map((p) => ({ value: p.value, label: p.label }))}
                onChange={(val) => setValue('academicPosition', val as any, { shouldValidate: true })}
                placeholder={t('selectPosition') || 'Select Position'}
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
              <CustomDropdown
                value={watch('gender') || ''}
                options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }]}
                onChange={(val) => setValue('gender', val as any, { shouldValidate: true })}
                placeholder="Select Gender"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Employment Type</label>
              <CustomDropdown
                value={watch('employmentType') || ''}
                options={[{ value: 'FULL_TIME', label: 'Full Time' }, { value: 'PART_TIME', label: 'Part Time' }]}
                onChange={(val) => setValue('employmentType', val as any, { shouldValidate: true })}
                placeholder="Select Employment Type"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* ── Section: Personal Details ── */}
        <div className="bg-gray-50/60 rounded-xl p-5">
          <SectionHeader title="Personal Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                First Name <span className="text-red-400">*</span>
              </label>
              <input {...register('firstName')} className="input" />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Last Name <span className="text-red-400">*</span>
              </label>
              <input {...register('lastName')} className="input" />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input {...register('email')} type="email" className="input" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>
        </div>

        {/* ── Section: Account ── */}
        <div className="bg-gray-50/60 rounded-xl p-5">
          <SectionHeader title="Account" />
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Password <span className="text-[10px] font-normal text-gray-400">(leave blank to keep current)</span>
            </label>
            <input
              {...register('password')}
              type="password"
              className="input"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>
        </div>

        {/* ── Section: Department ── */}
        <div className="bg-gray-50/60 rounded-xl p-5">
          <SectionHeader title="Responsible Department" />
          <div className="space-y-4">
            {/* Hidden departmentId */}
            <input type="hidden" {...register('departmentId')} />

            {/* Faculty Department */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Department <span className="text-red-400">*</span>
              </label>
              <CustomDeptDropdown
                value={isCustomDept ? '' : facultyDeptValue}
                options={allDepts as unknown as string[]}
                onSelect={(val) => {
                  if (val === '__OTHER__') {
                    setIsCustomDept(true);
                    setValue('facultyDepartment', '');
                  } else {
                    setIsCustomDept(false);
                    setValue('facultyDepartment', val, { shouldValidate: true });
                  }
                }}
                onRemove={(val) => {
                  setCustomDepts((prev) => prev.filter((d) => d !== val));
                  if (facultyDeptValue === val) setValue('facultyDepartment', '');
                }}
                placeholder="Select Department..."
              />
              {isCustomDept && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={facultyDeptValue}
                    onChange={(e) => setValue('facultyDepartment', e.target.value)}
                    placeholder="Enter department name"
                    className="input flex-1"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = facultyDeptValue.trim();
                      if (!trimmed) {
                        toast.error('Please enter a department name');
                        return;
                      }
                      if (!customDepts.includes(trimmed)) {
                        setCustomDepts((prev) => [...prev, trimmed]);
                      }
                      setIsCustomDept(false);
                      setValue('facultyDepartment', trimmed, { shouldValidate: true });
                    }}
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700"
                  >
                    Add
                  </button>
                </div>
              )}
              {errors.facultyDepartment && <p className="text-xs text-red-500 mt-1">{errors.facultyDepartment.message}</p>}

            </div>
          </div>
        </div>

        {/* ── Section: Workload Limits ── */}
        <div className="bg-gray-50/60 rounded-xl p-5">
          <SectionHeader title="Workload Limits" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('maxHours')}</label>
              <input {...register('maxWeeklyHours', { valueAsNumber: true })} type="number" className="input" />
              {errors.maxWeeklyHours && <p className="text-xs text-red-500 mt-1">{errors.maxWeeklyHours.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Min Hours</label>
              <input {...register('minWeeklyHours', { valueAsNumber: true })} type="number" className="input" />
              {errors.minWeeklyHours && <p className="text-xs text-red-500 mt-1">{errors.minWeeklyHours.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">{t('cancel')}</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
