
import { Routes, Route } from 'react-router-dom';
import { Login } from '../features/auth/Login';
import { Register } from '../features/auth/Register';
import { PrivateRoute } from '../components/PrivateRoute';
import { MainLayout } from '../components/layout/MainLayout';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Transactions } from '../features/transactions/Transactions';
import { Budgets } from '../features/budgets/Budgets';
import { Categories } from '../features/categories/Categories';
import { Reports } from '../features/reports/Reports';
import { Settings } from '../features/settings/Settings';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="categories" element={<Categories />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
