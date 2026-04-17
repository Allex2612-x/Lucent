import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

export function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.accessToken);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'A apărut o eroare la înregistrare');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Înregistrare</h1>
        <p className="auth-subtitle">Începe să-ți gestionezi finanțele inteligent.</p>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Prenume</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Nume</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Parolă</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} />
          </div>
          
          <button type="submit" className="btn-primary">Creează Contul</button>
        </form>
        
        <p className="auth-footer">
          Ai deja cont? <Link to="/login">Conectează-te</Link>
        </p>
      </div>
    </div>
  );
}
