// App configuration - change APP_NAME here or via API
const APP_NAME = 'MunchFlow';

export const CONFIG = {
  APP_NAME,
  API_BASE: '/api',
};

export const CASH_CATEGORIES = {
  income: [
    'Penjualan Harian',
    'Modal Awal',
    'Inject Kas',
    'Lain-lain',
  ],
  expense: [
    'Pembelian Bahan Baku',
    'Biaya Operasional',
    'Gaji/Bonus',
    'Maintenance',
    'Lain-lain',
  ],
};

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tunai' },
  { value: 'qris', label: 'QRIS' },
  { value: 'transfer', label: 'Transfer' },
];

export const UNITS = ['gram', 'kg', 'ml', 'liter', 'pcs', 'pack'];

export const MENU_CATEGORIES = ['Minuman Kopi', 'Minuman Non-Kopi', 'Makanan', 'Snack', 'Lainnya'];

export const ACCESSIBLE_MENU_OPTIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'pos', label: 'POS (Kasir)' },
  { key: 'cash', label: 'Kas Masuk & Keluar' },
  { key: 'inventory', label: 'Inventaris' },
  { key: 'recipes', label: 'Resep & Menu' },
  { key: 'reports', label: 'Laporan' },
];
