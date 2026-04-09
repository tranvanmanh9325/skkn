"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/axios";

export default function CreateUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "STAFF"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post("/users", formData);
      router.push("/users");
      router.refresh(); // Ensure the table re-fetches
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error.response?.data?.message || error.message || "Lỗi khi tạo tài khoản");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      {/* Back Button */}
      <div className="mb-6">
        <button 
          onClick={() => router.push('/users')}
          className="inline-flex items-center text-[13px] font-medium text-[#6B7A90] hover:text-[#0D2B5E] transition-colors"
        >
          <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
          </svg>
          Quay lại danh sách
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-[#0D2B5E] leading-none mb-3">
          TẠO TÀI KHOẢN MỚI
        </h1>
        <p className="text-[14px] text-[#6B7A90] m-0">
          Vui lòng điền thông tin để cấp quyền truy cập hệ thống.
        </p>
      </div>

      <div className="bg-white border border-[#CBD5E0] rounded-none shadow-sm h-full flex flex-col">
        <div className="px-6 py-4 border-b border-[#CBD5E0] bg-[#F7F9FC]">
          <h2 className="text-[13px] font-bold tracking-[0.05em] text-[#0A1F44] uppercase m-0">
            Thông tin nhân sự
          </h2>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-[13px] font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
            <div className="space-y-5">
              
              <div className="flex flex-col">
                <label className="text-[12px] font-bold tracking-[0.02em] text-[#0A1F44] mb-1.5 uppercase">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="nv.a@tha.gov.vn"
                  className="w-full px-4 py-2.5 text-[14px] text-[#0A1F44] border border-[#CBD5E0] bg-white focus:outline-none focus:border-[#2B5CE6] focus:ring-1 focus:ring-[#2B5CE6] transition-colors rounded-none placeholder:text-gray-400"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[12px] font-bold tracking-[0.02em] text-[#0A1F44] mb-1.5 uppercase">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 text-[14px] text-[#0A1F44] border border-[#CBD5E0] bg-white focus:outline-none focus:border-[#2B5CE6] focus:ring-1 focus:ring-[#2B5CE6] transition-colors rounded-none placeholder:text-gray-400"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[12px] font-bold tracking-[0.02em] text-[#0A1F44] mb-1.5 uppercase">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-2.5 text-[14px] text-[#0A1F44] border border-[#CBD5E0] bg-white focus:outline-none focus:border-[#2B5CE6] focus:ring-1 focus:ring-[#2B5CE6] transition-colors rounded-none placeholder:text-gray-400"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[12px] font-bold tracking-[0.02em] text-[#0A1F44] mb-1.5 uppercase">
                  Vai trò (RBAC) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-[14px] text-[#0A1F44] border border-[#CBD5E0] bg-white appearance-none focus:outline-none focus:border-[#2B5CE6] focus:ring-1 focus:ring-[#2B5CE6] transition-colors rounded-none cursor-pointer"
                  >
                    <option value="STAFF">Nhân viên (STAFF - Execution Officer)</option>
                    <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#6B7A90]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
                <p className="text-[11.5px] text-[#6B7A90] mt-1.5 leading-snug">
                  Nhân viên có quyền xem, chỉnh sửa hồ sơ. Quản trị viên có toàn quyền.
                </p>
              </div>

            </div>

            <div className="mt-8 pt-6 border-t border-[#E2E8F0] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/users')}
                className="px-6 py-2.5 text-[12px] font-bold tracking-[0.05em] uppercase text-[#6B7A90] border border-[#CBD5E0] hover:bg-[#F0F2F5] hover:text-[#0A1F44] transition-colors rounded-none"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-[12px] font-bold tracking-[0.05em] uppercase text-white bg-[#2B5CE6] hover:bg-[#2049BA] border border-transparent transition-colors rounded-none disabled:bg-gray-400 disabled:cursor-not-allowed min-w-[140px] flex justify-center"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                ) : (
                  "Lưu Tài Khoản"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
