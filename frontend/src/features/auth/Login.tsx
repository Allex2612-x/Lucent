import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { AuthShell } from '../../components/layout/AuthShell';
import { oauthService, OAuthProviders } from '../../services/oauth.service';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [providers, setProviders] = useState<OAuthProviders>({ google: false, facebook: false });
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  // Pick up OAuth round-trip results from the callback redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('oauth_token');
    const oauthErr = params.get('oauth_error');
    if (oauthErr) {
      setError(`Eroare OAuth: ${oauthErr}`);
      window.history.replaceState({}, '', '/login');
    } else if (token) {
      (async () => {
        try {
          const res = await api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });
          if (res.data?.success) {
            setAuth(res.data.data, token);
            navigate('/');
          }
        } catch (e: any) {
          setError('Nu am putut finaliza autentificarea OAuth.');
        }
      })();
    }
  }, [navigate, setAuth]);

  // Ask backend which providers are activated so we can hide non-configured buttons.
  useEffect(() => {
    let mounted = true;
    oauthService
      .getProviders()
      .then((res) => {
        if (mounted && res.data?.data) setProviders(res.data.data);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorCode(null);
    setSubmitting(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.accessToken);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'A apărut o eroare la autentificare');
      setErrorCode(err.response?.data?.code ?? null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div style={{ marginBottom: 32 }}>
        <div className="auth-eyebrow">Bun venit înapoi</div>
        <h1 className="auth-title">
          Intră în <em>contul tău</em>
        </h1>
        <div className="auth-sub">Continuă să-ți gestionezi finanțele de unde ai rămas.</div>
      </div>

      {error && (
        <div className="auth-form-error" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span>{error}</span>
          {errorCode === 'EMAIL_NOT_FOUND' && (
            <Link
              to="/register"
              style={{
                alignSelf: 'flex-start',
                color: 'var(--expense)',
                fontWeight: 600,
                fontSize: 12.5,
                textDecoration: 'underline',
              }}
            >
              Creează cont nou cu „{email}" →
            </Link>
          )}
          {errorCode === 'INVALID_PASSWORD' && (
            <Link
              to="/forgot-password"
              style={{
                alignSelf: 'flex-start',
                color: 'var(--expense)',
                fontWeight: 600,
                fontSize: 12.5,
                textDecoration: 'underline',
              }}
            >
              Resetează parola →
            </Link>
          )}
        </div>
      )}

      {(providers.google || providers.facebook) && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 18 }}>
            {providers.google && (
              <a
                className="btn btn-secondary"
                href={oauthService.startUrl('google')}
                style={{ justifyContent: 'center' }}
              >
                <svg width="14" height="14" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.7 4.8-6.3 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.3 35.1 26.8 36 24 36c-5 0-9.3-3.2-10.9-7.7l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4 5.6l6.3 5.2C41.7 35.8 44 30.5 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
                Google
              </a>
            )}
            {providers.facebook && (
              <a
                className="btn btn-secondary"
                href={oauthService.startUrl('facebook')}
                style={{ justifyContent: 'center' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2"><path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.7 9.1 8.4 9.9V14.9H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v6.9C18.3 21.1 22 17 22 12c0-5.5-4.5-10-10-10z"/></svg>
                Facebook
              </a>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-3)', fontSize: 11.5, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span>sau cu email</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nume@exemplu.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Parolă</span>
            <Link
              to="/forgot-password"
              style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
            >
              Am uitat parola?
            </Link>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
              autoComplete="current-password"
              style={{ width: '100%', paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ascunde parola' : 'Arată parola'}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-3)',
                cursor: 'pointer',
                padding: 4,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--text-2)',
            marginTop: 4,
          }}
        >
          <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
          Ține-mă autentificat 30 de zile
        </label>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={submitting}
          style={{ marginTop: 10 }}
        >
          {submitting ? 'Se autentifică...' : 'Autentificare'}
          <ArrowRight size={14} />
        </button>
      </form>

      <div className="auth-foot">
        <span>Nu ai cont încă?</span>
        <Link to="/register">Creează unul gratuit →</Link>
      </div>
    </AuthShell>
  );
}
