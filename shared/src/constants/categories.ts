export const DEFAULT_CATEGORIES = [
  // Expenses
  { name: 'Mâncare', type: 'expense', icon: 'pizza-outline', color: '#ff9800' },
  { name: 'Transport', type: 'expense', icon: 'car-outline', color: '#2196f3' },
  { name: 'Facturi', type: 'expense', icon: 'receipt-outline', color: '#f44336' },
  { name: 'Sănătate', type: 'expense', icon: 'medkit-outline', color: '#e91e63' },
  { name: 'Haine', type: 'expense', icon: 'shirt-outline', color: '#9c27b0' },
  { name: 'Divertisment', type: 'expense', icon: 'film-outline', color: '#673ab7' },
  
  // Incomes
  { name: 'Salariu', type: 'income', icon: 'cash-outline', color: '#4caf50' },
  { name: 'Bonus', type: 'income', icon: 'star-outline', color: '#8bc34a' },
  { name: 'Vânzări', type: 'income', icon: 'pricetag-outline', color: '#cddc39' },
] as const;
