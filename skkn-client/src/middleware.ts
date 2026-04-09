/**
 * middleware.ts — Next.js Edge Middleware
 *
 * Bảo vệ các route nhạy cảm. Chạy trên Edge Runtime (V8 Isolate),
 * KHÔNG có Node.js APIs. Dùng `jose` thay vì `jsonwebtoken`.
 *
 * Luồng xử lý:
 * 1. Request đến route được bảo vệ → đọc cookie `skkn_access_token`
 * 2. Nếu thiếu token → redirect về /login
 * 3. Nếu token tồn tại → verify chữ ký bằng jose + NEXT_PUBLIC_JWT_ACCESS_SECRET
 * 4. Nếu verify thất bại (hết hạn, sai chữ ký, ...) → redirect về /login
 * 5. Nếu user đã đăng nhập mà vào /login → redirect về /dashboard
 */
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { TOKEN_COOKIE_NAME } from "@/lib/auth-cookies";

// ---------------------------------------------------------------------------
// Cấu hình routes
// ---------------------------------------------------------------------------

/** Các prefix được bảo vệ — bất kỳ sub-path nào cũng cần auth */
const PROTECTED_PREFIXES = ["/dashboard", "/dossiers", "/settings", "/reports", "/users"];

/** Các route auth — user đã login sẽ bị redirect đi khỏi đây */
const AUTH_ROUTES = ["/login"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

/**
 * Verify JWT bằng `jose` — tương thích hoàn toàn với Edge Runtime.
 * Trả về payload nếu hợp lệ, null nếu thất bại (không throw để tránh crash middleware).
 */
async function verifyToken(token: string): Promise<boolean> {
  const secret = process.env.JWT_ACCESS_SECRET;

  // Middleware chạy trên server, dùng JWT_ACCESS_SECRET (không prefix NEXT_PUBLIC_)
  if (!secret) {
    // Cấu hình môi trường sai — fail-closed: block tất cả
    console.error("[Middleware] JWT_ACCESS_SECRET không được cấu hình.");
    return false;
  }

  try {
    const encodedSecret = new TextEncoder().encode(secret);
    await jwtVerify(token, encodedSecret, {
      // Thêm issuer/audience nếu Express backend set chúng khi ký token
      // algorithms: ["HS256"], // jose mặc định chấp nhận HS256
    });
    return true;
  } catch {
    // Bắt mọi lỗi: JWTExpired, JWSSignatureVerificationFailed, JWTInvalid, ...
    return false;
  }
}

// ---------------------------------------------------------------------------
// Middleware Handler
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  // ── Case 1: User đã có token và đang cố vào auth route (e.g., /login) ──
  if (isAuthRoute(pathname)) {
    if (token && (await verifyToken(token))) {
      // Token hợp lệ → redirect về dashboard, không cho vào login lại
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Không có token hoặc token invalid → cho qua (hiển thị login page)
    return NextResponse.next();
  }

  // ── Case 2: Route được bảo vệ ──
  if (isProtectedRoute(pathname)) {
    // Thiếu token → redirect về login ngay lập tức
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      // Lưu lại intended URL để sau login có thể redirect đúng chỗ
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isValid = await verifyToken(token);

    if (!isValid) {
      // Token tồn tại nhưng invalid/expired → xóa cookie và redirect
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(loginUrl);
      // Xóa cookie bị hỏng/hết hạn ngay tại edge để tránh vòng lặp
      response.cookies.delete(TOKEN_COOKIE_NAME);
      return response;
    }

    // Token hợp lệ → cho phép tiếp tục
    return NextResponse.next();
  }

  // ── Case 3: Route công khai (e.g., /, /about) → pass through ──
  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher — Chỉ chạy middleware trên các path cần thiết.
// Loại trừ static files, _next internals, và API routes để tối ưu performance.
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    /*
     * Match tất cả path NGOẠI TRỪ:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - public assets (png, jpg, svg, ...)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js)$).*)",
  ],
};
