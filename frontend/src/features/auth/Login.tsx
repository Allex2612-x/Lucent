import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { AuthShell } from '../../components/layout/AuthShell';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.accessToken);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'A apărut o eroare la autentificare');
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

      {error && <div className="auth-form-error">{error}</div>}

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
            <a style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }} href="#">
              Am uitat parola?
            </a>
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
