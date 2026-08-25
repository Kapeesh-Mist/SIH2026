/* =========================================================
   FinTrack — API client
   Talks to the backend in /backend. Change API_BASE if you
   deploy the backend somewhere other than localhost.
   ========================================================= */
const API_BASE = window.FINTRACK_API_BASE || 'http://localhost:4000/api';

function getToken(){ return localStorage.getItem('ft_token'); }
function getUser(){
  try{ return JSON.parse(localStorage.getItem('ft_user') || 'null'); }
  catch(e){ return null; }
}
function setSession(token, user){
  localStorage.setItem('ft_token', token);
  localStorage.setItem('ft_user', JSON.stringify(user));
}
function clearSession(){
  localStorage.removeItem('ft_token');
  localStorage.removeItem('ft_user');
}

async function apiRequest(path, { method = 'GET', body, auth = true } = {}){
  const headers = { 'Content-Type': 'application/json' };
  if (auth){
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  let res;
  try{
    res = await fetch(`${API_BASE}${path}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined
    });
  }catch(err){
    throw new Error('Could not reach the FinTrack server. Is the backend running on ' + API_BASE + '?');
  }
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(()=>({})) : null;
  if (!res.ok){
    throw new Error((data && data.message) || `Request failed (${res.status})`);
  }
  return data;
}

async function apiUpload(path, file, extraFields = {}){
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  Object.entries(extraFields).forEach(([k,v]) => form.append(k, v));
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: form
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data;
}

const Api = {
  login: (email, password, role) => apiRequest('/auth/login', { method:'POST', auth:false, body:{ email, password, role } }),
  me: () => apiRequest('/auth/me'),

  createUser: (payload) => apiRequest('/users', { method:'POST', body: payload }),
  listUsers: (schemeId) => apiRequest(`/users?schemeId=${schemeId}`),

  createScheme: (payload) => apiRequest('/schemes', { method:'POST', body: payload }),
  listSchemes: (status) => apiRequest(`/schemes${status ? `?status=${status}` : ''}`),
  getScheme: (id) => apiRequest(`/schemes/${id}`),

  uploadProgress: (schemeId, file, percent) => apiUpload(`/schemes/${schemeId}/progress`, file, { percent }),
  uploadExpenditure: (schemeId, file, amount) => apiUpload(`/schemes/${schemeId}/expenditure`, file, { amount }),
  verifyDoc: (schemeId, docId) => apiRequest(`/schemes/${schemeId}/verify/${docId}`, { method:'POST' }),
};
