import { I18nProvider } from './i18n';
import { ToastProvider } from './front/components/Toast';
import AdminApp from './admin/AdminApp';
import FrontApp from './front/FrontApp';

// Detect admin mode by hostname OR path
const isAdmin =
  typeof window !== 'undefined' &&
  (window.location.hostname.startsWith('admin.') ||
    window.location.pathname.startsWith('/admin'));

export default function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        {isAdmin ? <AdminApp /> : <FrontApp />}
      </ToastProvider>
    </I18nProvider>
  );
}
