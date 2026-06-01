import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';
import { requestsApi } from '../../api/requests.api';
import { CustomDropdown } from '../../components/shared/CustomDropdown';
import { FormHeader } from '../../components/shared/PageHeader';

const schema = z.object({
  type: z.string().min(1),
  subject: z.string().min(5),
  description: z.string().min(10),
});

type FormData = z.infer<typeof schema>;

export default function SubmitRequest() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const REQUEST_TYPES = [
    { value: 'ADD_COURSE',       label: t('ADD_COURSE')       || 'Add Course' },
    { value: 'REMOVE_COURSE',    label: t('REMOVE_COURSE')    || 'Remove Course' },
    { value: 'ADJUST_HOURS',     label: t('ADJUST_HOURS')     || 'Adjust Hours' },
    { value: 'EXTRA_ACTIVITY',   label: t('EXTRA_ACTIVITY')   || 'Extra Activity' },
    { value: 'OVERLOAD_REQUEST', label: t('OVERLOAD_REQUEST') || 'Overload Request' },
  ];

  async function onSubmit(data: FormData) {
    try {
      await requestsApi.create(data);
      toast.success(t('requestSubmitted') || 'Request submitted successfully');
      navigate('/faculty/requests');
    } catch {
      toast.error(t('failedToSubmit') || 'Failed to submit request');
    }
  }

  return (
    <div className="flex flex-col items-center min-h-full py-2">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          <div className="px-6 pt-6">
            <FormHeader
              title={t('submitWorkloadRequest') || 'Submit Workload Request'}
              subtitle="Fill in the details below and your request will be reviewed by an admin or department head"
              onClose={() => navigate('/faculty/requests')}
            />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-5">

            {/* Request Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('requestType') || 'Request Type'} <span className="text-red-400">*</span>
              </label>
              <CustomDropdown
                value={watch('type') || ''}
                options={REQUEST_TYPES}
                onChange={(val) => setValue('type', val, { shouldValidate: true })}
                placeholder={t('selectType') || 'Select request type...'}
                size="md"
                noCustom
              />
              {errors.type && (
                <p className="text-red-500 text-xs mt-1">{t('selectType') || 'Please select a type'}</p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('subject') || 'Subject'} <span className="text-red-400">*</span>
              </label>
              <input
                {...register('subject')}
                className="input"
                placeholder={t('briefSubject') || 'Brief subject of your request…'}
              />
              {errors.subject && (
                <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('description') || 'Description'} <span className="text-red-400">*</span>
              </label>
              <textarea
                {...register('description')}
                className="input resize-none"
                rows={5}
                placeholder={t('explainRequest') || 'Explain your request in detail…'}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60 shadow-sm"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? (t('submitting') || 'Submitting…') : (t('submitRequest') || 'Submit Request')}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {t('cancel') || 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
