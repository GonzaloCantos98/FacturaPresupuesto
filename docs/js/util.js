// Acepta "12,5", "12.5", "1.234,50" y números.
export function num(v) {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (v == null) return 0;
  let s = String(v).trim().replace(/\s|€/g, '');
  if (!s) return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

const r2 = n => Math.round((n + Number.EPSILON) * 100) / 100;

export function calcularTotales(doc) {
  const subtotal = r2((doc.lineas || []).reduce((s, l) => s + r2(num(l.cantidad) * num(l.precio)), 0));
  const ivaPct = num(doc.ivaPct ?? 21);
  const iva = r2(subtotal * ivaPct / 100);
  return { subtotal, ivaPct, iva, total: r2(subtotal + iva) };
}

const fmt = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });
export const euros = n => fmt.format(n) + ' €';

export function fechaES(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
export const hoyISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const normalizar = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
