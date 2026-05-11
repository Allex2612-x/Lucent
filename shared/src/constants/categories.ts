export const DEFAULT_CATEGORIES = [
  // Expenses
  { name: 'Mâncare', type: 'expense', icon: '🍕', color: '#ff9800' },
  { name: 'Transport', type: 'expense', icon: '🚗', color: '#2196f3' },
  { name: 'Facturi', type: 'expense', icon: '🧾', color: '#f44336' },
  { name: 'Sănătate', type: 'expense', icon: '⚕️', color: '#e91e63' },
  { name: 'Haine', type: 'expense', icon: '👕', color: '#9c27b0' },
  { name: 'Divertisment', type: 'expense', icon: '🎬', color: '#673ab7' },
  
  // Incomes
  { name: 'Salariu', type: 'income', icon: '💰', color: '#4caf50' },
  { name: 'Bonus', type: 'income', icon: '⭐', color: '#8bc34a' },
  { name: 'Vânzări', type: 'income', icon: '🏷️', color: '#cddc39' },
] as const;
