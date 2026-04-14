import axios from 'axios';

// ↓ Change this to YOUR PC IP address (run ipconfig to find it)
export const BASE_URL = 'http://10.243.236.160:5000';

const api = axios.create({
  baseURL:         BASE_URL,
  timeout:         10000,
  withCredentials: true,
  headers:         { 'Content-Type': 'application/json' },
});

export default api;