import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:4000/api', // Make sure this matches backend
    withCredentials: true, // Send cookies
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check if error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh token
                await axios.post('http://localhost:4000/api/auth/refresh', {}, {
                    withCredentials: true
                });

                // Retry original request (browser will send new cookie or backend uses cookie)
                // Note: If backend expects accessToken in header, we might need to get it from refresh response and attach it.
                // Assumes backend sends accessToken in body or cookie. 
                // Based on backend implementation: returns { accessToken }. We need to attach it if we use Bearer auth.

                // Let's re-read backend implementation logic...
                // Backend: `res.json({ accessToken: tokens.accessToken });`
                // And middleware checks `Authorization: Bearer <token>`. 

                // So we need to capture the new token and retry.
                const refreshRes = await axios.post('http://localhost:4000/api/auth/refresh', {}, { withCredentials: true });
                const newAccessToken = refreshRes.data.accessToken;

                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed (e.g. expired or revoked), redirect to login
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
