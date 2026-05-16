import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { AuthShell } from '../../components/layout/AuthShell';

export function ResetPassword() {
  const [search] = useSearchParams();
  const [token, setToken] = useState(search.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = search.get('token');
    if (t) setToken(t);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Parolele nu coincid.');
      return;
    }
    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', { token, newPassword: password });
      if (res.data?.success) {
        setDone(true);
        setTimeout(() => navigate('/login', { replace: true }), 1800);
      } else {
        setError(res.data?.message || 'Eroare la resetare.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Eroare la resetare.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div style={{ marginBottom: 32 }}>
        <div className="auth-eyebrow">Resetare parolă</div>
        <h1 className="auth-title">
          Setează o <em>parolă nouă</em>
        </h1>
        <div className="auth-sub">
          Introdu token-ul primit pe email și alege o parolă nouă.
        </div>
      </div>

      {error && <div className="auth-form-error">{error}</div>}
      {done && (
        <div className="auth-form-success">
          Parola a fost resetată. Te redirecționăm către autentificare...
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <label>Token de resetare</label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Lipește token-ul primit"
            required
          />
        </div>
        <div className="field">
          <label>Parolă nouă</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 caractere"
            required
          />
        </div>
        <div className="field">
          <label>Confirmă parola</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={submitting || done}
          style={{ marginTop: 4 }}
        >
          {submitting ? 'Se resetează...' : done ? 'Gata' : 'Resetează parola'}
          {!submitting && !done && <ArrowRight size={14} />}
        </button>
      </form>

      <div className="auth-foot">
        <span>Înapoi la</span>
        <Link to="/login">autentificare →</Link>
      </div>
    </AuthShell>
  );
}
