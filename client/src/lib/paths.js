// Route roles that change the chrome: the landing (/) and the scroll-driven G10 story (/g10).
export const STORY_PATH = '/g10';
export const isStoryPath = (pathname) => pathname === STORY_PATH || pathname === `${STORY_PATH}/`;
export const isLandingPath = (pathname) => pathname === '/';

// Where an account lands after login, register or opening a guest-only page: admins work in the panel only,
// customers go straight to the shop. A safe same-site `next` wins, except that an admin is only sent inside /admin.
export const ADMIN_HOME = '/admin';
export const CUSTOMER_HOME = '/shop';
const safeNext = (next) => (next && next.startsWith('/') && !next.startsWith('//') ? next : null);
export function landingFor(user, next) {
  const n = safeNext(next);
  if (user?.role === 'admin') return n && (n === '/admin' || n.startsWith('/admin/')) ? n : ADMIN_HOME;
  return n || CUSTOMER_HOME;
}
