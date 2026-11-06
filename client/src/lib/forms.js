// Map API validation details onto form fields and focus the first invalid one.
export const detailsToErrors = (err, prefix = '') => {
  const out = {};
  (err?.details || []).forEach((d) => {
    const path = prefix && d.path?.startsWith(prefix) ? d.path.slice(prefix.length) : d.path;
    if (path && !out[path]) out[path] = d.message;
  });
  return out;
};

export const focusFirstInvalid = (root) => {
  requestAnimationFrame(() => {
    const el = root?.querySelector?.('[aria-invalid="true"]');
    if (el) el.focus();
  });
};

export const PHONE_RE = /^(\+977)?9[678]\d{8}$/;
export const cleanPhone = (s = '') => s.replace(/[\s-]/g, '');
