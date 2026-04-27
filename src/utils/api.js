import axios from 'axios';

export const BASE_URL = 'https://intellibudgetai-main-production.up.railway.app';

const api = axios.create({
  baseURL:         BASE_URL,
  timeout:         15000,
  withCredentials: true,
  headers:         { 'Content-Type': 'application/json' },
});

export default api;