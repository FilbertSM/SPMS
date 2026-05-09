export const fetchWithAuth = async (url, options = {}) => {
  // Ambil token dari brankas Local Storage
  const token = localStorage.getItem('spms_token');

  // Gabungkan header bawaan dengan header Authorization
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const response = await fetch(`http://localhost:8000${url}`, {
    ...options,
    headers,
  });

  // Kalau token kedaluwarsa (401), otomatis tendang ke halaman login
  if (response.status === 401) {
    localStorage.removeItem('spms_token');
    window.location.href = '/login';
  }

  return response;
};