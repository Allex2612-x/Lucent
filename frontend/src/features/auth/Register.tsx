import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { AuthShell } from '../../components/layout/AuthShell';
import { oauthService, OAuthProviders } from '../../services/oauth.service';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  currency: string;
}

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH_LABELS = ['—', 'slabă', 'medie', 'bună', 'puternică'];
const STRENGTH_COLORS = ['var(--bg-inset)', 'var(--expense)', 'var(--warn)', 'var(--income)', 'var(--income)'];

export function Register() {
  const [formData, setFormData] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    currency: 'RON',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [providers, setProviders] = useState<OAuthProviders>({ google: false, facebook: false });
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

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

  const strength = useMemo(() => scorePassword(formData.password), [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { currency, ...rest } = formData;
      const res = await api.post('/auth/register', { ...rest, currency });
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.accessToken);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'A apărut o eroare la înregistrare');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div style={{ marginBottom: 32 }}>
        <div className="auth-eyebrow">Bine ai venit</div>
        <h1 className="auth-title">
          Începe să-ți <em>cunoști</em> banii
        </h1>
        <div className="auth-sub">30 de secunde și ești înăuntru. Fără card, fără cusur.</div>
      </div>

      {error && <div className="auth-form-error">{error}</div>}

      {(providers.google || providers.facebook) && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 18 }}>
            {providers.google && (
              <a className="btn btn-secondary" href={oauthService.startUrl('google')} style={{ justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.7 4.8-6.3 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.3 35.1 26.8 36 24 36c-5 0-9.3-3.2-10.9-7.7l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4 5.6l6.3 5.2C41.7 35.8 44 30.5 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
                Google
              </a>
            )}
            {providers.facebook && (
              <a className="btn btn-secondary" href={oauthService.startUrl('facebook')} style={{ justifyContent: 'center' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Prenume</label>
            <input name="firstName" value={formData.firstName} onChange={handleChange} required autoComplete="given-name" />
          </div>
          <div className="field">
            <label>Nume</label>
            <input name="lastName" value={formData.lastName} onChange={handleChange} required autoComplete="family-name" />
          </div>
        </div>

        <div className="field">
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="email" />
        </div>

        <div className="field">
          <label>Parolă</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Min. 6 caractere"
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 999,
                  background: step <= strength ? STRENGTH_COLORS[strength] : 'var(--bg-inset)',
                  transition: 'background .15s',
                }}
              />
            ))}
          </div>
          {formData.password.length > 0 && (
            <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
              Putere:{' '}
              <b style={{ color: STRENGTH_COLORS[strength] }}>
                {STRENGTH_LABELS[strength]}
              </b>
            </div>
          )}
        </div>

        <div className="field">
          <label>Monedă preferată</label>
          <select name="currency" value={formData.currency} onChange={handleChange}>
            <option value="RON">RON — Leu românesc</option>
            <option value="EUR">EUR — Euro</option>
            <option value="USD">USD — Dolar american</option>
          </select>
        </div>

        <label
          style={{
            display: 'flex',
            gap: 8,
            fontSize: 12.5,
            color: 'var(--text-2)',
            alignItems: 'flex-start',
            marginTop: 4,
          }}
        >
          <input
            type="checkbox"
            defaultChecked
            style={{ accentColor: 'var(--accent)', marginTop: 2 }}
          />
          <span>
            Sunt de acord cu <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Termenii</a> și{' '}
            <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Politica de confidențialitate</a>.
          </span>
        </label>

        <button
          type="submit"
          className="btn btn-accent btn-lg"
          disabled={submitting}
          style={{ marginTop: 6 }}
        >
          {submitting ? 'Se creează contul...' : 'Creează cont'}
        </button>
      </form>

      <div className="auth-foot">
        <span>Ai deja cont?</span>
        <Link to="/login">Conectează-te →</Link>
      </div>
    </AuthShell>
  );
}
