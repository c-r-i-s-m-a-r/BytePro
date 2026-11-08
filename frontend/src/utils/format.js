export function formatPrice(value) {
  const n = Number(value || 0);
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function stockLabel(stock) {
  const n = Number(stock || 0);
  if (n <= 0) return { text: 'Agotado', className: 'badge-agotado' };
  if (n <= 5) return { text: `Últimas ${n}`, className: 'badge-low' };
  return { text: 'Disponible', className: 'badge-stock' };
}
