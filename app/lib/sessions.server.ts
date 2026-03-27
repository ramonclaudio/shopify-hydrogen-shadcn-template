import {createCookieSessionStorage} from 'react-router';
import {createThemeSessionResolver} from 'remix-themes';

const isProduction = process.env.NODE_ENV === 'production';

// For theme storage, we don't need a secure secret since it's just storing light/dark preference
// Use environment variable if available, otherwise use a default value
const sessionSecret =
  process.env.SESSION_SECRET || 'default-theme-secret-change-in-production';

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'theme',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secrets: [sessionSecret],
    ...(isProduction ? {secure: true} : {}),
  },
});

export const themeSessionResolver = createThemeSessionResolver(sessionStorage);
