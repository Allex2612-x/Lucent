import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Budget } from '@sasha-licenta/shared';

export function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const res = await api.get('/budgets');
      setBudgets(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="budgets-container">
      <div className="page-header">
        <h1>Bugete Lunare</h1>
        <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }}>+ Creează Buget</button>
      </div>

      <div className="dashboard-grid">
        {loading ? (
          <p>Se încarcă bugetele...</p>
        ) : budgets.length === 0 ? (
          <div className="card">
             <p>Nu ai configurat niciun buget încă.</p>
          </div>
        ) : (
          budgets.map(b => (
            <div key={b.id} className="card">
              <h3>{b.month}/{b.year}</h3>
              <p>Limită Totală: {b.totalLimit}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
