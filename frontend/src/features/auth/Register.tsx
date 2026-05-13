import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { AuthShell } from '../../components/layout/AuthShell';

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
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

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
