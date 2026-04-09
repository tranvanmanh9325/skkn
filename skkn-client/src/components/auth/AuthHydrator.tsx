"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getAuthCookie } from "@/lib/auth-cookies";
import { decodeJwt } from "jose";

export default function AuthHydrator({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    // --- BẮT ĐẦU DEBUG CHUYÊN SÂU ---
    console.groupCollapsed("🔍 [AuthHydrator] Debug Session");
    const rawToken = getAuthCookie();
    console.log("1. Raw Token đọc từ js-cookie:", rawToken || "Không tìm thấy (null/undefined)");
    
    if (rawToken) {
      try {
        const decoded = decodeJwt(rawToken);
        console.log("2. Decoded JWT Payload:", decoded);
      } catch (error) {
        console.error("2. Lỗi khi Decode JWT Token:", error);
      }
    }
    console.groupEnd();
    // --- KẾT THÚC DEBUG ---

    // Được gọi khi component mount bên phía client.
    // Hàm initAuth (đã định nghĩa trong store) sẽ lo việc đọc JWT từ js-cookie,
    // decode và cập nhật state người dùng trước khi render Layout.
    initAuth();
    
    // Sử dụng setTimeout để đưa việc update state vào Macro Task
    // Tránh lỗi "Calling setState synchronously within an effect" từ React Linter.
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [initAuth]);

  // Chặn render giao diện trong lần render đầu tiên cho tới khi Zustand store 
  // đã nạp thành công token từ Cookie. Tránh lỗi nháy nội dung (hydration flash).
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[#F0F2F5]">
        <div className="flex flex-col items-center space-y-5">
          <div className="w-8 h-8 border-4 border-[#CBD5E0] border-t-[#0D2B5E] rounded-full animate-spin" />
          <span className="text-[12px] font-bold tracking-[0.1em] text-[#0A1F44] uppercase">
            Đang xác thực phiên làm việc...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
