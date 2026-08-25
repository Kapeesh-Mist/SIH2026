/* =========================================================
   FinTrack — shared UI helpers (toast, modal, guards, topbar)
   ========================================================= */
function toast(msg, isErr = false){
  let el = document.querySelector('.toast');
  if (!el){
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.toggle('err', !!isErr);
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(()=> el.classList.remove('show'), 3200);
}

function openModal(id){ document.getElementById(id)?.classList.add('show'); }
function closeModal(id){ document.getElementById(id)?.classList.remove('show'); }

function initials(email){
  if (!email) return '?';
  return email.trim()[0].toUpperCase();
}

/** Redirects unauthenticated users to login, and fills the topbar identity. */
function requireAuth(allowedRoles){
  const user = getUser();
  if (!user || !getToken()){
    window.location.href = 'login.html';
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)){
    window.location.href = roleHome(user.role);
    return null;
  }
  const nameEl = document.querySelector('[data-who-name]');
  const roleEl = document.querySelector('[data-who-role]');
  const avEl = document.querySelector('[data-who-avatar]');
  if (nameEl) nameEl.textContent = user.email;
  if (roleEl) roleEl.textContent = user.role;
  if (avEl) avEl.textContent = initials(user.email);
  return user;
}

function roleHome(role){
  if (role === 'admin') return 'admin-dashboard.html';
  if (role === 'intermediate') return 'intermediate-dashboard.html';
  return 'enduser-dashboard.html';
}

function logout(){
  clearSession();
  window.location.href = 'login.html';
}

function fmtMoney(n){
  const num = Number(n || 0);
  return '₹' + num.toLocaleString('en-IN');
}

function fmtDate(d){
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function riskBadgeClass(risk){
  if (risk === 'high') return 'badge-risk-high';
  if (risk === 'medium') return 'badge-risk-med';
  return 'badge-risk-low';
}

function qs(name){
  return new URLSearchParams(window.location.search).get(name);
}
