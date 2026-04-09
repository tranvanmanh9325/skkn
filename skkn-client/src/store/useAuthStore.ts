import { create } from "zustand";
import { decodeJwt } from "jose";
import { getAuthCookie, removeAuthCookie } from "@/lib/auth-cookies";

interface User {
  email: string;
  role: string;
  sub: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  initAuth: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  
  initAuth: () => {
    const token = getAuthCookie();
    if (token) {
      try {
        const decoded = decodeJwt(token);
        set({
          user: {
            // Đọc trực tiếp từ JWT payload (đảm bảo backend đã sign các trường này)
            email: (decoded.email as string) || "GUEST",
            role: (decoded.role as string) || "GUEST",
            sub: decoded.sub as string,
          },
          isAuthenticated: true,
        });
      } catch (error) {
        console.error("Token decoding failed:", error);
        removeAuthCookie();
        set({ user: null, isAuthenticated: false });
      }
    } else {
      set({ user: null, isAuthenticated: false });
    }
  },

  logout: () => {
    removeAuthCookie();
    set({ user: null, isAuthenticated: false });
  },
}));
