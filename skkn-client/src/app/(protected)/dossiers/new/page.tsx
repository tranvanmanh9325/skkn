"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/axios";

export default function CreateDossierPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    dossierId: "",
    parties: "",
    acceptanceDate: "",
    status: "PENDING",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post("/dossiers", formData);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const error = err as Error & { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || error.message || "Lỗi tạo hồ sơ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full pt-8 px-4">
      <div className="mb-8">
        <Link 
          href="/dashboard"
          className="text-[13px] font-bold text-[#6B7A90] hover:text-[#0A1F44] transition-colors flex items-center gap-2 mb-4 w-fit"
        >
          &larr; Quay lại Bảng điều khiển
        </Link>
        <h1 
          className="text-[22px] font-bold tracking-tight text-[#0A1F44] leading-none mb-2 uppercase"
          style={{ letterSpacing: "-0.02em" }}
        >
          THÊM MỚI HỒ SƠ
        </h1>
        <p className="text-[13px] text-[#6B7A90] font-normal leading-snug">
          Khởi tạo hồ sơ thi hành án mới vào hệ thống.
        </p>
      </div>

      <div className="bg-white border border-[#CBD5E0] p-8 rounded-none shadow-sm flex-1 mb-8">
        {error && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-600 text-[13px] rounded-none">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="dossierId" className="text-[12px] font-bold tracking-[0.02em] text-[#0A1F44] uppercase">
              Mã hồ sơ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="dossierId"
              name="dossierId"
              value={formData.dossierId}
              onChange={handleChange}
              required
              placeholder="Nhập mã hồ sơ (Ví dụ: THA-2026-001)"
              className="px-4 py-3 border border-[#CBD5E0] text-[14px] text-[#0A1F44] placeholder-[#A0AEC0] outline-none rounded-none focus:border-[#2B5CE6] focus:ring-1 focus:ring-[#2B5CE6] transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="parties" className="text-[12px] font-bold tracking-[0.02em] text-[#0A1F44] uppercase">
              Đương sự <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="parties"
              name="parties"
              value={formData.parties}
              onChange={handleChange}
              required
              placeholder="Nhập họ tên người phải thi hành án..."
              className="px-4 py-3 border border-[#CBD5E0] text-[14px] text-[#0A1F44] placeholder-[#A0AEC0] outline-none rounded-none focus:border-[#2B5CE6] focus:ring-1 focus:ring-[#2B5CE6] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="acceptanceDate" className="text-[12px] font-bold tracking-[0.02em] text-[#0A1F44] uppercase">
                Ngày thụ lý <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="acceptanceDate"
                name="acceptanceDate"
                value={formData.acceptanceDate}
                onChange={handleChange}
                required
                className="px-4 py-3 border border-[#CBD5E0] text-[14px] text-[#0A1F44] outline-none rounded-none focus:border-[#2B5CE6] focus:ring-1 focus:ring-[#2B5CE6] transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="status" className="text-[12px] font-bold tracking-[0.02em] text-[#0A1F44] uppercase">
                Trạng thái <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="px-4 py-3 border border-[#CBD5E0] text-[14px] text-[#0A1F44] outline-none rounded-none focus:border-[#2B5CE6] focus:ring-1 focus:ring-[#2B5CE6] transition-all appearance-none cursor-pointer bg-white"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='square' stroke-linejoin='miter'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                  backgroundSize: "1em",
                }}
              >
                <option value="PENDING">CHỜ DUYỆT</option>
                <option value="EXECUTING">ĐANG THI HÀNH</option>
                <option value="COMPLETED">ĐÃ XONG</option>
                <option value="SUSPENDED">TẠM ĐÌNH CHỈ</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mr-4 px-6 py-3 text-[13px] font-bold tracking-[0.05em] uppercase text-[#6B7A90] border border-transparent hover:text-[#0A1F44] transition-colors rounded-none"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 text-[13px] font-bold tracking-[0.05em] uppercase text-white bg-[#2B5CE6] hover:bg-[#2049BA] transition-colors rounded-none disabled:opacity-50 flex items-center justify-center gap-2 min-w-[160px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                  Đang lưu...
                </>
              ) : (
                "LƯU HỒ SƠ"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
