/**
 * auth-cookies.ts
 *
 * Quản lý auth cookie phía client sau khi Axios nhận response thành công.
 * js-cookie được dùng vì nó handle cross-browser cookie API một cách nhất quán.
 *
 * LƯU Ý BẢO MẬT:
 * - Cookie KHÔNG được set httpOnly từ client-side JS (không thể — đó là server-side concern).
 * - Để đạt httpOnly thực sự, hãy dùng Next.js Route Handler/Server Action thay thế.
 * - Cookie này được Middleware đọc để verify JWT, nên PHẢI là js-accessible (không httpOnly).
 * - Thêm `Secure` + `SameSite=Strict` để giảm thiểu XSS/CSRF risk.
 */
import Cookies from "js-cookie";

export const TOKEN_COOKIE_NAME = "skkn_access_token";

// 15 phút — khớp với TTL Access Token của Express backend
const ACCESS_TOKEN_TTL_MINUTES = 15;

/**
 * Ghi access token vào cookie ngay sau khi login thành công.
 * Được gọi từ Zustand auth store khi API trả về 200.
 */
export function setAuthCookie(accessToken: string): void {
  Cookies.set(TOKEN_COOKIE_NAME, accessToken, {
    expires: ACCESS_TOKEN_TTL_MINUTES / (24 * 60), // js-cookie dùng đơn vị ngày
    sameSite: "Strict",
    // `secure: true` chỉ nên bật trên production (HTTPS).
    // Dùng biến env để tránh break local development qua HTTP.
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

/**
 * Xóa access token cookie khi logout hoặc nhận 401 từ backend.
 */
export function removeAuthCookie(): void {
  Cookies.remove(TOKEN_COOKIE_NAME, { path: "/" });
}

/**
 * Đọc token từ cookie (dùng phía client, ví dụ: để attach vào Axios interceptor).
 * Middleware sẽ đọc trực tiếp từ request headers — không cần hàm này ở Edge runtime.
 */
export function getAuthCookie(): string | undefined {
  return Cookies.get(TOKEN_COOKIE_NAME);
}
