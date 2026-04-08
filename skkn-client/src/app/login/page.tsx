"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Schema — tách ra file riêng (e.g. src/lib/schemas/auth.schema.ts) khi refactor
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  account: z
    .string()
    .min(1, "Vui lòng nhập tài khoản.")
    .max(100, "Tài khoản không được vượt quá 100 ký tự."),
  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự.")
    .max(128, "Mật khẩu không được vượt quá 128 ký tự."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Zustand store mock — thay bằng import thực: `import { useAuthStore } from "@/stores/auth.store"`
// ---------------------------------------------------------------------------
const useAuthStore = () => ({
  login: async (account: string): Promise<void> => {
    // Giả lập API call — xóa khi tích hợp store thực
    await new Promise((resolve) => setTimeout(resolve, 1200));
    if (account === "fail@test.com") throw new Error("Sai tài khoản hoặc mật khẩu.");
  },
});

// ---------------------------------------------------------------------------
// Bespoke SVG Icons — Không dùng bất kỳ icon library nào.
// Mỗi icon được xây dựng từ primitive shapes với uniform stroke 1.2px.
// ---------------------------------------------------------------------------

/**
 * UserIcon: 3 strokes — nửa vòng tròn (đầu), hình thang cụt (vai), đường
 * thẳng đứng trung tâm (đường đối xứng kiến trúc).
 */
const UserIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Đầu: nửa vòng tròn mở phía dưới */}
    <path
      d="M10 3 A4 4 0 0 1 14 7 A4 4 0 0 1 6 7 A4 4 0 0 1 10 3"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Vai: hình thang cụt đối xứng */}
    <path
      d="M4 17 C4 13 7 11 10 11 C13 11 16 13 16 17"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    {/* Đường trung tâm đối xứng — signature của icon system này */}
    <line
      x1="10"
      y1="11"
      x2="10"
      y2="14"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * LockIcon: Thân ổ khóa là hình chữ nhật (không bo góc — quyền uy pháp lý).
 * Cần khóa bất đối xứng: cột phải cao hơn 3px → gợi ý "đang mở khóa" khi active.
 * Lỗ chìa khóa: hình tròn + đường thẳng đứng (neo-geometric, không dùng keyhole cổ điển).
 */
const LockIcon = ({
  className,
  isActive = false,
}: {
  className?: string;
  isActive?: boolean;
}) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Thân ổ khóa — hình chữ nhật tuyệt đối */}
    <rect
      x="4"
      y="9"
      width="12"
      height="9"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    {/*
     * Cần khóa bất đối xứng: cột trái kết thúc tại y=9, cột phải kết thúc tại y=6.
     * Khi isActive (field đang focus): cần khóa "nghiêng mở" — cột phải nâng lên y=4.
     */}
    <path
      d={
        isActive
          ? "M7 9 L7 6 Q7 3 10 3 Q13 3 13 6 L13 4"  // nghiêng mở khi active
          : "M7 9 L7 6 Q7 3 10 3 Q13 3 13 6 L13 9"  // đóng hoàn toàn khi idle
      }
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transition: "d 0.2s ease" }}
    />
    {/* Lỗ chìa: hình tròn nhỏ */}
    <circle cx="10" cy="13.5" r="1.2" fill="currentColor" />
    {/* Lỗ chìa: đường thẳng đứng neo-geometric */}
    <line
      x1="10"
      y1="14.7"
      x2="10"
      y2="16.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * EyeIcon & EyeOffIcon: Uniform 1.2px stroke, cùng design grammar.
 */
const EyeIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M2 10 C4 5 16 5 18 10 C16 15 4 15 2 10Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M2 10 C4 5 16 5 18 10"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path
      d="M4 12.5 C6 14.5 14 14.5 16 12.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <line
      x1="3"
      y1="3"
      x2="17"
      y2="17"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// THA Monogram — logotype hình học tối giản, không dùng ký tự font
// ---------------------------------------------------------------------------
const THAMonogram = () => (
  <svg
    width="32"
    height="22"
    viewBox="0 0 32 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="THA Monogram"
  >
    {/* Chữ T: đường ngang + đường đứng */}
    <line x1="1" y1="3" x2="9" y2="3" stroke="#0D2B5E" strokeWidth="2" strokeLinecap="square" />
    <line x1="5" y1="3" x2="5" y2="19" stroke="#0D2B5E" strokeWidth="2" strokeLinecap="square" />
    {/* Chữ H: hai cột + thanh ngang giữa */}
    <line x1="11" y1="3" x2="11" y2="19" stroke="#0D2B5E" strokeWidth="2" strokeLinecap="square" />
    <line x1="19" y1="3" x2="19" y2="19" stroke="#0D2B5E" strokeWidth="2" strokeLinecap="square" />
    <line x1="11" y1="11" x2="19" y2="11" stroke="#0D2B5E" strokeWidth="2" strokeLinecap="square" />
    {/* Chữ A: hai cạnh xiên + thanh ngang */}
    <path d="M21 19 L26 3 L31 19" stroke="#0D2B5E" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    <line x1="23" y1="13" x2="29" y2="13" stroke="#0D2B5E" strokeWidth="2" strokeLinecap="square" />
    {/* Dấu chấm accent — signature của icon system */}
    <rect x="15" y="1" width="2" height="2" fill="#2B5CE6" />
  </svg>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched", // Validate khi blur, không phải onChange — UX tốt hơn cho form pháp lý
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setServerError(null);

    try {
      // Khi tích hợp store thực: await login(data.account, data.password)
      await login(data.account);
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"
      // Subtle matte grid texture qua CSS pattern — không dùng background image ngoài
      style={{
        backgroundImage:
          "radial-gradient(circle, #D8DEE9 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      {/*
       * Login Card: zero border-radius, subtle shadow — quyền uy pháp lý
       * Width cố định 440px: đủ rộng cho form, đủ compact để có không khí xung quanh
       */}
      <div
        className="w-[440px] bg-[#FAFAFA] border border-[#E2E6EA]"
        style={{
          boxShadow: "0 4px 32px 0 rgba(0, 30, 80, 0.07), 0 1px 4px 0 rgba(0, 30, 80, 0.04)",
        }}
      >
        {/* ── Header: Logotype + Tên hệ thống ── */}
        <div className="flex items-center gap-3 px-8 pt-8 pb-6">
          <THAMonogram />
          <div className="flex flex-col">
            <span
              className="text-[10px] font-semibold tracking-[0.08em] text-[#0D2B5E] uppercase leading-tight"
              style={{ fontFeatureSettings: '"kern" 1' }}
            >
              QUẢN LÝ HỒ SƠ
            </span>
            <span
              className="text-[10px] font-semibold tracking-[0.08em] text-[#0D2B5E] uppercase leading-tight"
            >
              THI HÀNH ÁN
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#D8DEE9] mx-8" />

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="px-8 pt-7 pb-8">
          {/* Title Block */}
          <div className="mb-7">
            <h1
              className="text-[26px] font-bold tracking-tight text-[#0A1F44] leading-none mb-2"
              style={{ letterSpacing: "-0.02em" }}
            >
              ĐĂNG NHẬP
            </h1>
            <p className="text-[13px] text-[#6B7A90] font-normal leading-snug">
              Vui lòng nhập thông tin tài khoản để tiếp tục.
            </p>
          </div>

          {/* Server-level Error Banner */}
          {serverError && (
            <div
              role="alert"
              className="mb-5 px-4 py-3 border border-[#E53E3E] bg-[#FFF5F5] text-[#C53030] text-[12.5px] leading-snug"
            >
              {serverError}
            </div>
          )}

          {/* ── Field: Tài khoản ── */}
          <div className="mb-4">
            <label
              htmlFor="account"
              className="block text-[11.5px] font-semibold tracking-[0.04em] text-[#4A5568] uppercase mb-1.5"
            >
              Tài khoản
            </label>
            <div className="relative">
              {/* User Icon — absolute positioned, căn trái */}
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <UserIcon className="w-[18px] h-[18px] text-[#A0AEC0]" />
              </div>
              <input
                id="account"
                type="text"
                autoComplete="username"
                placeholder="Email hoặc số hiệu cán bộ"
                aria-invalid={!!errors.account}
                aria-describedby={errors.account ? "account-error" : undefined}
                {...register("account")}
                className={[
                  "w-full h-11 pl-10 pr-4",
                  "bg-white border text-[#0A1F44] text-[13.5px]",
                  "placeholder:text-[#A0AEC0]",
                  "outline-none transition-colors duration-150",
                  "rounded-none", // Zero border-radius — ràng buộc thiết kế
                  errors.account
                    ? "border-[#E53E3E] focus:border-[#E53E3E]"
                    : "border-[#CBD5E0] focus:border-[#2B5CE6]",
                ].join(" ")}
              />
            </div>
            {errors.account && (
              <p
                id="account-error"
                role="alert"
                className="mt-1.5 text-[11.5px] text-[#C53030] leading-snug"
              >
                {errors.account.message}
              </p>
            )}
          </div>

          {/* ── Field: Mật khẩu ── */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-[11.5px] font-semibold tracking-[0.04em] text-[#4A5568] uppercase mb-1.5"
            >
              Mật khẩu
            </label>
            <div className="relative">
              {/*
               * Lock Icon — active khi field đang focused → cần khóa "nghiêng mở"
               * Truyền isActive qua state passwordFocused
               */}
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <LockIcon
                  className={`w-[18px] h-[18px] transition-colors duration-150 ${
                    passwordFocused ? "text-[#2B5CE6]" : "text-[#A0AEC0]"
                  }`}
                  isActive={passwordFocused}
                />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password", {
                  onBlur: () => setPasswordFocused(false),
                })}
                onFocus={() => setPasswordFocused(true)}
                className={[
                  "w-full h-11 pl-10 pr-11",
                  "bg-white border text-[#0A1F44] text-[13.5px]",
                  "placeholder:text-[#A0AEC0]",
                  "outline-none transition-colors duration-150",
                  "rounded-none",
                  errors.password
                    ? "border-[#E53E3E] focus:border-[#E53E3E]"
                    : "border-[#CBD5E0] focus:border-[#2B5CE6]",
                ].join(" ")}
              />
              {/* Toggle hiển thị mật khẩu */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#A0AEC0] hover:text-[#4A5568] transition-colors duration-150"
              >
                {showPassword ? (
                  <EyeOffIcon className="w-[18px] h-[18px]" />
                ) : (
                  <EyeIcon className="w-[18px] h-[18px]" />
                )}
              </button>
            </div>
            {errors.password && (
              <p
                id="password-error"
                role="alert"
                className="mt-1.5 text-[11.5px] text-[#C53030] leading-snug"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {/* ── Submit Button ── */}
          <button
            type="submit"
            disabled={isLoading}
            className={[
              "w-full h-11",
              "bg-[#0D2B5E] text-white",
              "text-[12.5px] font-semibold tracking-[0.1em] uppercase",
              "rounded-none border-l-2 border-transparent", // border-left dùng cho hover accent
              "transition-all duration-150",
              "hover:bg-[#1A3A6E] hover:border-l-[#2B5CE6]",
              "focus:outline-none focus:ring-2 focus:ring-[#2B5CE6] focus:ring-offset-2 focus:ring-offset-[#FAFAFA]",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                {/* Spinner tối giản — không dùng icon library */}
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2"
                  />
                  <path
                    d="M10 3 A7 7 0 0 1 17 10"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Đang xác thực...
              </span>
            ) : (
              "ĐĂNG NHẬP"
            )}
          </button>
        </form>

        {/* ── Footer ── */}
        <div className="border-t border-[#E2E6EA] px-8 py-3.5">
          <p className="text-[10.5px] text-[#9BA8B8] text-center leading-snug">
            © 2025 Cơ quan Thi hành án Dân sự. Bản quyền được bảo hộ.
          </p>
        </div>
      </div>
    </main>
  );
}
