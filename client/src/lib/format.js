const nf = new Intl.NumberFormat('en-IN');

export const formatNPR = (n) => `NPR ${nf.format(Math.round(Number(n) || 0))}`;

export const formatRange = (from, to) => (from === to ? formatNPR(from) : `${formatNPR(from)} – ${nf.format(Math.round(to))}`);

export const formatDate = (iso) => {
  try {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
  } catch {
    return '';
  }
};

export const sentenceCase = (s = '') => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);

export const colourLabel = (c) => (c?.nameNe ? `${c.name} · ${c.nameNe}` : c?.name || '');
