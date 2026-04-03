/* ================================================================
   starter — Frontend SPA
   JWT-based client router + API client
   ================================================================ */

const API = '';   // same origin — Spring Boot serves this file

// ----------------------------------------------------------------
// Storage helpers
// ----------------------------------------------------------------
const Auth = {
  save(data) {
    localStorage.setItem('_token', data.token);
    localStorage.setItem('_user',  JSON.stringify({
      email:     data.email,
      firstName: data.firstName,
      lastName:  data.lastName,
      role:      data.role,
    }));
  },
  clear() {
    localStorage.removeItem('_token');
    localStorage.removeItem('_user');
  },
  token()    { return localStorage.getItem('_token'); },
  user()     { try { return JSON.parse(localStorage.getItem('_user') || 'null'); } catch { return null; } },
  isAdmin()  { const u = Auth.user(); return u && u.role === 'ROLE_ADMIN'; },
  loggedIn() { return !!Auth.token(); },
};

// ----------------------------------------------------------------
// API client
// ----------------------------------------------------------------
async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (Auth.token()) headers['Authorization'] = 'Bearer ' + Auth.token();
  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return {};
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || json.error || 'Request failed (' + res.status + ')');
  return json;
}

// ----------------------------------------------------------------
// Toast
// ----------------------------------------------------------------
let toastTimer;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast toast-' + type + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

// ----------------------------------------------------------------
// Alert helpers
// ----------------------------------------------------------------
function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'alert alert-' + type + ' visible';
}
function clearAlert(id) {
  const el = document.getElementById(id);
  if (el) el.className = 'alert';
}

// ----------------------------------------------------------------
// Page / view router
// ----------------------------------------------------------------
const pages = ['landing', 'login', 'register', 'app'];

function showPage(name) {
  pages.forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) el.classList.toggle('hidden', p !== name);
  });
  window.scrollTo(0, 0);
}

function navigate(view) {
  ['dashboard', 'profile', 'admin'].forEach(v => {
    const el = document.getElementById('view-' + v);
    if (el) el.classList.toggle('hidden', v !== view);
    const navEl = document.getElementById('nav-' + v);
    if (navEl) navEl.classList.toggle('active', v === view);
  });

  if (view === 'dashboard') loadDashboard();
  if (view === 'profile')   loadProfile();
  if (view === 'admin')     loadAdminUsers();
}

// ----------------------------------------------------------------
// Auth flow
// ----------------------------------------------------------------
document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  clearAlert('login-alert');
  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  try {
    const data = await api('POST', '/api/v1/auth/login', {
      email:    document.getElementById('login-email').value,
      password: document.getElementById('login-password').value,
    });
    Auth.save(data);
    enterApp();
  } catch (err) {
    showAlert('login-alert', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
});

document.getElementById('register-form').addEventListener('submit', async e => {
  e.preventDefault();
  clearAlert('register-alert');
  const btn = document.getElementById('register-btn');
  btn.disabled = true;
  btn.textContent = 'Creating account…';
  try {
    const data = await api('POST', '/api/v1/auth/register', {
      firstName: document.getElementById('reg-first').value,
      lastName:  document.getElementById('reg-last').value,
      email:     document.getElementById('reg-email').value,
      password:  document.getElementById('reg-password').value,
    });
    Auth.save(data);
    enterApp();
    showToast('Welcome to starter! 🎉');
  } catch (err) {
    showAlert('register-alert', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
});

function enterApp() {
  const user = Auth.user();
  if (!user) return;

  // Sidebar user widget
  const initials = (user.firstName[0] || '') + (user.lastName[0] || '');
  document.getElementById('sidebar-avatar').textContent = initials.toUpperCase();
  document.getElementById('sidebar-name').textContent = user.firstName + ' ' + user.lastName;
  document.getElementById('sidebar-role').textContent = Auth.isAdmin() ? '👑 Admin' : '🙂 User';

  // Show/hide admin links
  document.querySelectorAll('.admin-only').forEach(el => {
    el.classList.toggle('hidden', !Auth.isAdmin());
  });

  showPage('app');
  navigate('dashboard');
}

function logout() {
  Auth.clear();
  showPage('landing');
}

// ----------------------------------------------------------------
// Dashboard
// ----------------------------------------------------------------
async function loadDashboard() {
  const user = Auth.user();
  document.getElementById('dash-name').textContent = user?.firstName || '';
  document.getElementById('topbar-greeting').textContent =
    new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
  document.getElementById('stat-role').textContent = Auth.isAdmin() ? 'Admin' : 'User';

  if (Auth.isAdmin()) {
    try {
      const stats = await api('GET', '/api/v1/admin/stats');
      document.getElementById('stat-total-users').textContent = stats.totalUsers ?? '—';
      document.getElementById('stat-admins').textContent      = stats.admins ?? '—';
    } catch { /* silently ignore */ }
  }
}

// ----------------------------------------------------------------
// Profile
// ----------------------------------------------------------------
async function loadProfile() {
  try {
    const user = await api('GET', '/api/v1/profile');
    document.getElementById('profile-hero-name').textContent  = user.firstName + ' ' + user.lastName;
    document.getElementById('profile-hero-email').textContent = user.email;
    const initials = (user.firstName?.[0] || '') + (user.lastName?.[0] || '');
    document.getElementById('profile-avatar-lg').textContent  = initials.toUpperCase();

    const isAdmin = user.roles?.includes('ROLE_ADMIN');
    document.getElementById('profile-hero-badge').innerHTML   =
      isAdmin ? '<span class="badge badge-admin">👑 Admin</span>' : '<span class="badge badge-user">User</span>';

    document.getElementById('pf-first').value  = user.firstName || '';
    document.getElementById('pf-last').value   = user.lastName  || '';
    document.getElementById('pf-bio').value    = user.bio       || '';
    document.getElementById('pf-avatar').value = user.avatarUrl || '';
  } catch (err) {
    showToast('Failed to load profile: ' + err.message, 'error');
  }
}

document.getElementById('profile-form').addEventListener('submit', async e => {
  e.preventDefault();
  clearAlert('profile-alert');
  try {
    await api('PUT', '/api/v1/profile', {
      firstName: document.getElementById('pf-first').value,
      lastName:  document.getElementById('pf-last').value,
      bio:       document.getElementById('pf-bio').value,
      avatarUrl: document.getElementById('pf-avatar').value,
    });

    // Update sidebar
    const user = Auth.user();
    if (user) {
      user.firstName = document.getElementById('pf-first').value;
      user.lastName  = document.getElementById('pf-last').value;
      localStorage.setItem('_user', JSON.stringify(user));
      document.getElementById('sidebar-name').textContent = user.firstName + ' ' + user.lastName;
      document.getElementById('sidebar-avatar').textContent =
        (user.firstName[0] + user.lastName[0]).toUpperCase();
    }

    showToast('Profile updated successfully ✓');
    loadProfile();
  } catch (err) {
    showAlert('profile-alert', err.message, 'error');
    document.getElementById('profile-alert').classList.add('visible');
  }
});

document.getElementById('password-form').addEventListener('submit', async e => {
  e.preventDefault();
  clearAlert('pw-alert');
  const newPw    = document.getElementById('pw-new').value;
  const confirm  = document.getElementById('pw-confirm').value;
  if (newPw !== confirm) {
    showAlert('pw-alert', 'New passwords do not match.', 'error');
    document.getElementById('pw-alert').classList.add('visible');
    return;
  }
  try {
    await api('PUT', '/api/v1/profile/password', {
      currentPassword: document.getElementById('pw-current').value,
      newPassword:     newPw,
    });
    document.getElementById('password-form').reset();
    showToast('Password changed successfully ✓');
  } catch (err) {
    showAlert('pw-alert', err.message, 'error');
    document.getElementById('pw-alert').classList.add('visible');
  }
});

// ----------------------------------------------------------------
// Admin panel
// ----------------------------------------------------------------
async function loadAdminUsers() {
  const tbody = document.getElementById('admin-users-body');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">Loading users…</td></tr>';
  try {
    const users = await api('GET', '/api/v1/admin/users');
    document.getElementById('admin-user-count').textContent = users.length + ' users';

    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">No users found.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => {
      const isAdmin   = u.roles?.includes('ROLE_ADMIN');
      const joined    = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—';
      const roleBadge = isAdmin
        ? '<span class="badge badge-admin">👑 Admin</span>'
        : '<span class="badge badge-user">User</span>';
      const toggleLabel = isAdmin ? 'Make User' : 'Make Admin';
      const newRole     = isAdmin ? 'ROLE_USER'  : 'ROLE_ADMIN';
      return `<tr>
        <td style="color:var(--text-muted);font-size:0.8rem;">#${u.id}</td>
        <td><strong>${u.firstName} ${u.lastName}</strong></td>
        <td style="font-size:0.85rem;">${u.email}</td>
        <td>${roleBadge}</td>
        <td style="color:var(--text-muted);font-size:0.82rem;">${joined}</td>
        <td>
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" onclick="changeRole(${u.id},'${newRole}')">${toggleLabel}</button>
            <button class="btn btn-danger  btn-sm" onclick="deleteUser(${u.id},'${u.firstName}')">Delete</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--danger);">${err.message}</td></tr>`;
  }
}

async function changeRole(id, role) {
  try {
    await api('PUT', `/api/v1/admin/users/${id}/role`, { role });
    showToast('Role updated ✓');
    loadAdminUsers();
  } catch (err) {
    showToast('Failed: ' + err.message, 'error');
  }
}

async function deleteUser(id, name) {
  if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
  try {
    await api('DELETE', `/api/v1/admin/users/${id}`);
    showToast(`User "${name}" deleted.`);
    loadAdminUsers();
  } catch (err) {
    showToast('Failed: ' + err.message, 'error');
  }
}

// ----------------------------------------------------------------
// Boot
// ----------------------------------------------------------------
(function boot() {
  if (Auth.loggedIn()) {
    enterApp();
  } else {
    showPage('landing');
  }
})();
