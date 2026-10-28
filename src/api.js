import axios from 'axios';

const isLocalhost = Boolean(
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname === '')
);

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ||
        (isLocalhost
            ? 'http://localhost:5000/api'
            : 'https://hcm-lite-hackhaton.vercel.app/api')
});

export default api;
