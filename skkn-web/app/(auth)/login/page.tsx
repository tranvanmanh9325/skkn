"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // ── Login form ─────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      const response = await api.post("/auth/login", data);
      const token: string = response.data.token;
      localStorage.setItem("token", token);
      router.push("/");
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response === "object"
      ) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setServerError(
          axiosErr.response?.data?.message ?? "Đăng nhập thất bại. Vui lòng thử lại."
        );
      } else {
        setServerError("Không thể kết nối đến máy chủ.");
      }
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center bg-white px-4">
      {/* ── Header: logo (left) + text block (right), absolutely pinned to top ── */}
      <div className="absolute top-12 left-0 right-0 flex justify-center items-center">
        <header className="flex flex-row items-center justify-center gap-4">
          <Image
            src="/logo.webp"
            alt="Logo Công an nhân dân Việt Nam"
            width={64}
            height={64}
            priority
            className="object-contain flex-shrink-0"
          />
          <div className="flex flex-col gap-0.5">
            {/* Line 1: bold, dark blue — blue-900 = #1e3a8a */}
            <span className="text-blue-900 font-extrabold text-sm sm:text-base uppercase leading-tight tracking-wide">
              PHẦN MỀM SỐ HÓA HỒ SƠ THI HÀNH ÁN
            </span>
            {/* Line 2: medium weight, blue-800 = #1e40af */}
            <span className="text-blue-800 font-medium text-xs sm:text-sm uppercase tracking-widest">
              CÔNG AN NHÂN DÂN VIỆT NAM
            </span>
          </div>
        </header>
      </div>

      {/* ── Form — flat on white bg, NO card / shadow / border ── */}
      <section className="w-[400px] max-w-full">
        <h1 className="text-center text-xl font-bold text-gray-900 mb-6">
          Đăng nhập vào hệ thống
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {/* Username */}
          <div>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="admin"
              {...register("username")}
              className={`w-full rounded-md border px-3 py-2.5 text-sm bg-blue-50 text-gray-700 placeholder:text-gray-400 outline-none transition focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
                errors.username ? "border-red-400" : "border-blue-200"
              }`}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="....."
              {...register("password")}
              className={`w-full rounded-md border px-3 py-2.5 text-sm bg-blue-50 text-gray-700 placeholder:text-gray-400 outline-none transition focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
                errors.password ? "border-red-400" : "border-blue-200"
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Forgot password — now a button trigger instead of a route Link */}
          <div className="flex justify-end -mt-1">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(true)}
              className="text-xs text-blue-600 underline-offset-4 hover:underline"
            >
              Quên mật khẩu
            </button>
          </div>

          {/* Server-side error */}
          {serverError && (
            <p className="text-center text-xs text-red-500 -mt-1">{serverError}</p>
          )}

          {/* Submit — dark red #cc1f24, full-width matches inputs */}
          <button
            id="btn-login"
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-[#cc1f24] py-2.5 text-sm font-bold text-white tracking-wide transition hover:bg-[#b01a1e] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </section>

      {/* ── Forgot Password Modal ─────────────────────────────────────────────── */}
      {isForgotModalOpen && (
        <ForgotPasswordModal onClose={() => setIsForgotModalOpen(false)} />
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// ForgotPasswordModal — extracted to keep LoginPage clean
// ---------------------------------------------------------------------------
interface ForgotPasswordModalProps {
  onClose: () => void;
}

function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [forgotUsername, setForgotUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const handleForgotPassword = async () => {
    if (!forgotUsername.trim()) return;

    setIsLoading(true);
    setFeedback(null);

    try {
      await api.post("/auth/forgot-password", { username: forgotUsername.trim() });
      setFeedback({
        type: "success",
        message: "Yêu cầu đã được gửi thành công. Vui lòng kiểm tra email hoặc liên hệ quản trị viên.",
      });
      // Auto-close after a short delay so the user can read the message
      setTimeout(onClose, 2500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFeedback({
        type: "error",
        message:
          axiosErr.response?.data?.message ?? "Đã xảy ra lỗi. Vui lòng thử lại.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Close modal when clicking the backdrop (outside the box)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-modal-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <div className="relative w-[400px] max-w-[calc(100vw-2rem)] rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 id="forgot-modal-title" className="text-base font-bold text-gray-900">
            Quên mật khẩu
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="text-gray-400 hover:text-gray-700 transition text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <p className="text-sm text-gray-500 mb-4">
          Nhập tên đăng nhập của bạn để nhận liên kết đặt lại mật.
        </p>

        <input
          id="forgot-username"
          type="text"
          value={forgotUsername}
          onChange={(e) => setForgotUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
          placeholder="Tên đăng nhập"
          className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:ring-2 focus:ring-blue-400 focus:border-blue-400 mb-4"
        />

        {/* Inline feedback */}
        {feedback && (
          <p
            className={`text-xs mb-4 ${
              feedback.type === "success" ? "text-green-600" : "text-red-500"
            }`}
          >
            {feedback.message}
          </p>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={isLoading || !forgotUsername.trim()}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
      </div>
    </div>
  );
}
