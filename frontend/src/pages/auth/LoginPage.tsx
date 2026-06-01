import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth, user, isInitialized } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isInitialized || !user) return;
    if (user.role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
    else if (user.role === 'DEPARTMENT_HEAD') navigate('/head/dashboard', { replace: true });
    else navigate('/faculty/dashboard', { replace: true });
  }, [isInitialized, user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const result = await authApi.login(data.email, data.password);
      setAuth(result.user, result.accessToken);
      toast.success(t('welcomeBack', { name: result.user.firstName }));

      const role = result.user.role;
      if (role === 'ADMIN') navigate('/admin/dashboard');
      else if (role === 'DEPARTMENT_HEAD') navigate('/head/dashboard');
      else navigate('/faculty/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('loginFailed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-700 flex items-center justify-center p-4">
      {/* Language switcher — top right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher dark />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo inside the card */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-white border border-gray-100 rounded-3xl p-3 shadow-md mb-4">
              <img
                src="/npuu-logo.png"
                alt="NPUU Logo"
                className="w-20 h-20 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-primary-700">{t('appName')}</h1>
            <p className="text-primary-500 mt-1 text-sm">{t('appSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">{t('emailAddress')}</label>
              <input
                {...register('email')}
                type="email"
                className="input"
                placeholder="your@university.edu"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">{t('password')}</label>
              <input
                {...register('password')}
                type="password"
                className="input"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? t('signingIn') : t('signIn')}
            </button>
          </form>

          <div className="mt-6 p-4 bg-primary-50 border border-primary-100 rounded-lg text-xs text-primary-700">
            <p className="font-medium mb-2 text-primary-800">{t('testAccounts')}:</p>
            <p>Admin: admin@university.edu / Admin@123</p>
            <p>Head: cs.head@university.edu / Head@123</p>
            <p>Faculty: prof.yusupov@university.edu / Faculty@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
