// Route roles that change the chrome: the landing (/) and the scroll-driven G10 story (/g10).
export const STORY_PATH = '/g10';
export const isStoryPath = (pathname) => pathname === STORY_PATH || pathname === `${STORY_PATH}/`;
export const isLandingPath = (pathname) => pathname === '/';
