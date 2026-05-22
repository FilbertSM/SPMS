export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const buildUrl = (url) => {
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url}`;
};

const readPayload = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }
  return response.text().catch(() => null);
};

const errorMessage = (payload, fallback) => {
  if (typeof payload === 'string' && payload) return payload;
  if (Array.isArray(payload?.detail)) return payload.detail[0]?.msg || fallback;
  return payload?.detail || payload?.message || fallback;
};

export const fetchJson = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(buildUrl(url), {
    ...options,
    headers,
  });

  const payload = await readPayload(response);

  if (!response.ok) {
    throw new Error(errorMessage(payload, `Request failed with status ${response.status}`));
  }

  return payload;
};

export const postForm = async (url, formData, options = {}) => {
  const response = await fetch(buildUrl(url), {
    ...options,
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...options.headers,
    },
    body: formData,
  });

  const payload = await readPayload(response);

  if (!response.ok) {
    throw new Error(errorMessage(payload, `Request failed with status ${response.status}`));
  }

  return payload;
};

export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('spms_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const response = await fetch(buildUrl(url), {
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
  const payload = await readPayload(response);

  if (!response.ok) {
    throw new Error(errorMessage(payload, `Request failed with status ${response.status}`));
  }

  return payload;
};

export const fetchBlobWithAuth = async (url, options = {}) => {
  const response = await fetchWithAuth(url, options);

  if (!response.ok) {
    const payload = await readPayload(response);
    throw new Error(errorMessage(payload, `Request failed with status ${response.status}`));
  }

  return response.blob();
};
