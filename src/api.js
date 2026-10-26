import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiBaseUrl = configuredApiUrl
    ? `${configuredApiUrl.replace(/\/+$/, '').replace(/\/api$/i, '')}/api`
    : '/api';

const api = axios.create({
    baseURL: apiBaseUrl
});

export default api;
