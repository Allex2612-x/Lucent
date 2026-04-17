
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

export function Navbar() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore errors on logout
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>Sasha</h2>
      </div>
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>Dashboard</NavLink>
        <NavLink to="/transactions" className={({ isActive }) => isActive ? "active" : ""}>Tranzacții</NavLink>
        <NavLink to="/budgets" className={({ isActive }) => isActive ? "active" : ""}>Bugete</NavLink>
      </div>
      <div className="navbar-user">
        <span>Salut, {user?.firstName}</span>
        <button onClick={handleLogout} className="btn-logout">Ieșire</button>
      </div>
    </nav>
  );
}
