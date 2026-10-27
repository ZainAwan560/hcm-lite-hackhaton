import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ||
        'https://hcm-lite-hackhaton.vercel.app/api'
});

export default api;