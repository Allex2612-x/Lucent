import { useEffect, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppRoutes } from './routes/index.tsx';
import { api } from './services/api';
import { useAuthStore } from './store/useAuthStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

/**
 * Validates a persisted session once at app boot. If an access token was
 * rehydrated from localStorage we silently refresh it (which also proves the
 * 7-day refresh cookie is still valid) before letting protected routes render.
 * Eliminates the stale-token dashboard flash + hard reload to /login.
 */
function AuthGate({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const hasVerified = useAuthStore((s) => s.hasVerified);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const markVerified = useAuthStore((s) => s.markVerified);

  useEffect(() => {
    if (hasVerified) return;
    if (!accessToken) {
      markVerified(); // fresh visitor — nothing to validate
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.post('/auth/refresh', {}, { withCredentials: true });
        const token: string | undefined = res.data?.data?.accessToken;
        if (token && user) {
          if (!cancelled) setAuth(user, token);
        } else if (!cancelled) {
          logout();
        }
      } catch {
        if (!cancelled) logout();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasVerified, accessToken, user, setAuth, logout, markVerified]);

  if (!hasVerified) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-app)' }}>
        <div className="faro-boot-spinner" aria-label="Se încarcă" />
      </div>
    );
  }
  return <>{children}</>;
}

function App() {
  // Reformat open views immediately when date/locale preferences change
  // (Settings dispatches 'faro-preferences-changed'). The date helpers read
  // localStorage at call time, so invalidating queries re-renders the lists.
  useEffect(() => {
    const onPrefsChanged = () => queryClient.invalidateQueries();
    window.addEventListener('faro-preferences-changed', onPrefsChanged);
    return () => window.removeEventListener('faro-preferences-changed', onPrefsChanged);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthGate>
          <AppRoutes />
        </AuthGate>
        <Toaster 
          position="top-right"
          style={{ zIndex: 9999 }}
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
