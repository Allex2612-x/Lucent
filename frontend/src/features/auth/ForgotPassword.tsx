import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { api } from '../../services/api';
import { AuthShell } from '../../components/layout/AuthShell';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sentMessage, setSentMessage] = useState('');
  const [devToken, setDevToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSentMessage('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data?.success) {
        setSentMessage(res.data.message ?? 'Cerere trimisă.');
        // Backend exposes the token in non-production for demo purposes
        if (res.data?.token) setDevToken(res.data.token);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Eroare la trimiterea cererii.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div style={{ marginBottom: 32 }}>
        <div className="auth-eyebrow">Resetare parolă</div>
        <h1 className="auth-title">
          Recuperează-ți <em>contul</em>
        </h1>
        <div className="auth-sub">
          Scrie email-ul cu care te-ai înregistrat. Îți trimitem un link de resetare.
        </div>
      </div>

      {error && <div className="auth-form-error">{error}</div>}
      {sentMessage && <div className="auth-form-success">{sentMessage}</div>}

      {devToken && (
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: 'var(--accent-soft)',
            border: '1px solid rgba(37,71,245,0.2)',
            marginBottom: 14,
            fontSize: 12.5,
            color: 'var(--text-2)',
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--accent-ink)', fontWeight: 600, marginBottom: 6 }}>
            DEMO · token de dezvoltare
          </div>
          <div>
            Într-un mediu real ai primi un email cu link de resetare. Pentru demo, token-ul este afișat aici:
          </div>
          <div
            className="mono"
            style={{
              marginTop: 8,
              padding: 8,
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 6,
              fontSize: 11.5,
              wordBreak: 'break-all',
            }}
          >
            {devToken}
          </div>
          <button
            type="button"
            onClick={() => navigate(`/reset-password?token=${encodeURIComponent(devToken)}`)}
            className="btn btn-primary btn-sm"
            style={{ marginTop: 10 }}
          >
            <Check size={12} /> Continuă la resetare
          </button>
        </div>
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
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={submitting}
          style={{ marginTop: 4 }}
        >
          {submitting ? 'Se trimite...' : 'Trimite link de resetare'}
          <ArrowRight size={14} />
        </button>
      </form>

      <div className="auth-foot">
        <span>Ți-ai amintit parola?</span>
        <Link to="/login">Înapoi la autentificare →</Link>
      </div>
    </AuthShell>
  );
}
