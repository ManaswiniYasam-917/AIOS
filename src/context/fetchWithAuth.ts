/**
 * Helper to perform fetch requests with JWT authentication automatically.
 * Separated into its own module to ensure Vite Fast Refresh compatibility.
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('aios_token');
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  return fetch(url, { ...options, headers });
};
