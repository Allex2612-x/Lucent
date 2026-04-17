
import { Routes, Route } from 'react-router-dom';
import { Login } from '../features/auth/Login';
import { Register } from '../features/auth/Register';
import { PrivateRoute } from '../components/PrivateRoute';
import { MainLayout } from '../components/layout/MainLayout';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Transactions } from '../features/transactions/Transactions';
import { Budgets } from '../features/budgets/Budgets';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="budgets" element={<Budgets />} />
      </Route>
    </Routes>
  );
}
