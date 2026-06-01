import { Navigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';

interface Props {
  allowedRoles: string[];
}

function AuthLoadingScreen() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">{t('initializingSystem')}</p>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { user, isInitialized } = useAuthStore();

  if (!isInitialized) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
