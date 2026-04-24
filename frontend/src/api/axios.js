import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api', // Backend base URL
});

// Interceptor to attach token
API.interceptors.request.use((req) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        req.headers.Authorization = `Bearer ${JSON.parse(userInfo).token}`;
    }
    return req;
});

export default API;
