"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";

// ---------------------------------------------------------------------------
// Validation schema
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
  const [serverError, setServerError] = useState<string | null>(null);

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
      // POST /auth/login — backend sets an httpOnly cookie or returns a token
      const response = await api.post("/auth/login", data);
      // TODO: persist token / redirect to dashboard
      console.log("Login success", response.data);
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

          {/* Forgot password — right-aligned, underline on hover */}
          <div className="flex justify-end -mt-1">
            <Link
              href="/forgot-password"
              className="text-xs text-blue-600 underline-offset-4 hover:underline"
            >
              Quên mật khẩu
            </Link>
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
    </main>
  );
}
