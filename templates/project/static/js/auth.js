/* ================================================================
   auth.js — JWT + localStorage session management
   ================================================================ */

const KEYS = { token: '_sg_token', user: '_sg_user' };

const Auth = window.Auth = {
  save(data) {
    localStorage.setItem(KEYS.token, data.token);
    localStorage.setItem(KEYS.user, JSON.stringify({
      email:     data.email     || '',
      firstName: data.firstName || '',
      lastName:  data.lastName  || '',
      role:      data.role      || 'ROLE_USER',
    }));
  },

  clear() {
    localStorage.removeItem(KEYS.token);
    localStorage.removeItem(KEYS.user);
  },

  token() { return localStorage.getItem(KEYS.token); },

  user() {
    try { return JSON.parse(localStorage.getItem(KEYS.user) || 'null'); }
    catch { return null; }
  },

  isAdmin()  { const u = this.user(); return u?.role === 'ROLE_ADMIN'; },
  loggedIn() { return !!this.token() && !!this.user(); },

  initials() {
    const u = this.user();
    if (!u) return '??';
    return ((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase();
  },

  fullName() {
    const u = this.user();
    if (!u) return '';
    return u.firstName + ' ' + u.lastName;
  },
};
