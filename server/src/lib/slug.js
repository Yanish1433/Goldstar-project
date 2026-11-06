/** "AX-1/A" -> "ax-1-a", "G10 L2102" -> "g10-l2102". */
export function slugify(input) {
  return String(input ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "trek-collection" -> "Trek collection" */
export function slugToSentence(slug) {
  const s = String(slug).replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
