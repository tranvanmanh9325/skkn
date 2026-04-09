import axios from 'axios';
import { getAuthCookie } from '@/lib/auth-cookies';

// Đảm bảo URL luôn chuẩn:
// Giả định NEXT_PUBLIC_API_URL trong .env là http://localhost:5001
let rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Lọc bỏ hậu tố /api hoặc /api/v1 nếu người dùng lỡ viết thừa trong .env
rawUrl = rawUrl.replace(/\/+$/, ''); // bỏ trailing slash
if (rawUrl.endsWith('/api/v1')) rawUrl = rawUrl.replace('/api/v1', '');
else if (rawUrl.endsWith('/api')) rawUrl = rawUrl.replace('/api', '');

export const apiClient = axios.create({
  // Nối chính xác cấu trúc route của backend
  baseURL: `${rawUrl}/api/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios Interceptor để tự động đính kèm accessToken vào request
apiClient.interceptors.request.use(
  (config) => {
    // Lấy token bằng hàm dùng chung để đảm bảo đọc đúng key 'skkn_access_token'
    const token = getAuthCookie();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
