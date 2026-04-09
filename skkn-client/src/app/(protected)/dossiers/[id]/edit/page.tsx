"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/axios";

export default function EditDossierPage() {
  const router = useRouter();
  const params = useParams();
  const humanDossierId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lưu trữ original DB _id cho request PUT
  const [dossierDbId, setDossierDbId] = useState<string>("");

  const [formData, setFormData] = useState({
    dossierId: "",
    parties: "",
    acceptanceDate: "",
    status: "PENDING",
  });

  useEffect(() => {
    let isMounted = true;
    const fetchDossier = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/dossiers/${humanDossierId}`);
        if (isMounted) {
          const dossier = res.data.data;
          setDossierDbId(dossier._id);
          setFormData({
            dossierId: dossier.dossierId || "",
            parties: dossier.parties || "",
            // Format ngày acceptanceDate để dùng cho input type="date"
            acceptanceDate: dossier.acceptanceDate 
              ? new Date(dossier.acceptanceDate).toISOString().split('T')[0] 
              : "",
            status: dossier.status || "PENDING",
          });
        }
      } catch (err) {
        if (isMounted) {
          const error = err as Error & { response?: { data?: { message?: string } } };
          setError(error.response?.data?.message || error.message || "Lỗi tải dữ liệu hồ sơ");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (humanDossierId) {
      fetchDossier();
    }

    return () => {
      isMounted = false;
    };
  }, [humanDossierId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossierDbId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Dùng DB _id cho route PUT như yêu cầu của backend
      await apiClient.put(`/dossiers/${dossierDbId}`, formData);
      // Quay trở lại trang detail theo ID mới (vì có thể họ đổi dossierId)
      router.push(`/dossiers/${formData.dossierId}`);
      router.refresh();
    } catch (err) {
      const error = err as Error & { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || error.message || "Lỗi cập nhật hồ sơ");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-full min-h-[500px]">
        <div className="w-8 h-8 border-2 border-[#CBD5E0] border-t-[#0D2B5E] animate-spin rounded-full mb-4"></div>
        <p className="text-[13.5px] text-[#6B7A90] font-medium tracking-tight">Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full pt-8 px-4">
      <div className="mb-8">
        <Link 
          href={`/dossiers/${humanDossierId}`}
          className="text-[13px] font-bold text-[#6B7A90] hover:text-[#0A1F44] transition-colors flex items-center gap-2 mb-4 w-fit"
        >
          &larr; Quay lại trang chi tiết
        </Link>
        <h1 
          className="text-[22px] font-bold tracking-tight text-[#0A1F44] leading-none mb-2 uppercase"
          style={{ letterSpacing: "-0.02em" }}
        >
          SỬA HỒ SƠ
        </h1>
        <p className="text-[13px] text-[#6B7A90] font-normal leading-snug">
          Cập nhật thông tin hồ sơ thi hành án trên hệ thống.
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
              onClick={() => router.push(`/dossiers/${humanDossierId}`)}
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
