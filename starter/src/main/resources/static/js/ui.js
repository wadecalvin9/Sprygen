/* ================================================================
   ui.js — Toast, alerts, counters, loaders
   ================================================================ */

// ── Toast ─────────────────────────────────────────────────────
let _toastTimer;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast toast-' + type + ' show';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

// ── Alert inside a form ───────────────────────────────────────
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

// ── Animated counter ─────────────────────────────────────────
function animateCount(el, target, duration = 800) {
  if (!el) return;
  const start = 0;
  const step  = target / (duration / 16);
  let current = start;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.round(current).toLocaleString();
    if (current >= target) clearInterval(timer);
  }, 16);
}

// ── Busy button ───────────────────────────────────────────────
function setBusy(btn, busy, label) {
  btn.disabled = busy;
  if (busy) {
    btn.dataset.orig = btn.textContent;
    btn.textContent  = label || 'Working…';
  } else {
    btn.textContent = btn.dataset.orig || btn.textContent;
  }
}

// expose globally
window.showToast  = showToast;
window.showAlert  = showAlert;
window.clearAlert = clearAlert;
window.animateCount = animateCount;
window.setBusy    = setBusy;
