import axios from 'axios';

const api = axios.create({
    baseURL: 'https://hcm-lite-hackhaton.vercel.app/api'
});

export default api;
