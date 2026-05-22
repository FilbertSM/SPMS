export const fetchWithAuth = async (url, options = {}) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const token = localStorage.getItem('spms_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('spms_token');
    window.location.href = '/login';
  }

  return response;
};

export const fetchJsonWithAuth = async (url, options = {}) => {
  const response = await fetchWithAuth(url, options);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.detail || payload?.message || `Request failed with status ${response.status}`);
  }

  return payload;
};
