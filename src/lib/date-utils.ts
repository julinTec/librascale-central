import { format } from 'date-fns';

/**
 * Formata uma data de forma segura, retornando fallback quando inválida/nula.
 * Aceita strings 'YYYY-MM-DD' (adiciona T12:00:00 para evitar TZ), ISO ou Date.
 */
export function safeFormat(
  value: string | Date | null | undefined,
  pattern: string,
  fallback: string = '—',
  options?: Parameters<typeof format>[2]
): string {
  if (!value) return fallback;
  try {
    let d: Date;
    if (value instanceof Date) {
      d = value;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      d = new Date(value + 'T12:00:00');
    } else {
      d = new Date(value);
    }
    if (isNaN(d.getTime())) return fallback;
    return format(d, pattern, options);
  } catch {
    return fallback;
  }
}
