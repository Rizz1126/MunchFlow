/**
 * Format number as Indonesian Rupiah
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format percentage
 */
export function formatPercent(value) {
  if (value == null || isNaN(value)) return '0%';
  return `${value.toFixed(1)}%`;
}

/**
 * Format date string to Indonesian locale
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format datetime
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getToday() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get start of week (Monday) as YYYY-MM-DD
 */
export function getStartOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * Get start of month as YYYY-MM-DD
 */
export function getStartOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
