"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/axios";

interface DossierDetail {
  _id: string;
  dossierId: string;
  acceptanceDate: string;
  parties: string;
  status: string;
  assignedOfficer?: {
    name: string;
    employeeId: string;
  };
  createdAt: string;
  // Các field khác nếu có
}

export default function DossierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dossierId = params.id as string;

  const [dossier, setDossier] = useState<DossierDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDossier = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/dossiers/${dossierId}`);
        if (isMounted) {
          setDossier(res.data.data);
        }
      } catch (err) {
        if (isMounted) {
          const error = err as Error & { response?: { data?: { message?: string } } };
          setError(error.response?.data?.message || error.message || "Lỗi tải dữ liệu");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (dossierId) {
      fetchDossier();
    }

    return () => {
      isMounted = false;
    };
  }, [dossierId]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Đang chờ xử lý';
      case 'EXECUTING': return 'Đang thi hành';
      case 'COMPLETED': return 'Đã xong';
      case 'SUSPENDED': return 'Tạm đình chỉ';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]';
      case 'EXECUTING': return 'bg-[#DBEAFE] text-[#1E40AF] border-[#3B82F6]';
      case 'COMPLETED': return 'bg-[#D1FAE5] text-[#065F46] border-[#10B981]';
      case 'SUSPENDED': return 'bg-[#FEE2E2] text-[#991B1B] border-[#EF4444]';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
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

  if (error || !dossier) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-full min-h-[500px]">
        <div className="w-16 h-16 border border-[#CBD5E0] bg-[#F0F2F5] flex items-center justify-center mb-5 rounded-none">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-[#A0AEC0]">
            <path d="M12 8 V12 M12 16 H12.01 M22 12 A10 10 0 1 1 2 12 A10 10 0 0 1 22 12 Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        </div>
        <p className="text-[14px] font-bold text-[#0D2B5E] mb-2 uppercase tracking-tight">Không tìm thấy hồ sơ</p>
        <p className="text-[13px] text-red-600 mb-6">{error || "Hồ sơ không tồn tại hoặc bạn không có quyền truy cập."}</p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="text-[12px] font-bold tracking-[0.05em] uppercase text-[#0D2B5E] border border-[#0D2B5E] px-6 py-2.5 hover:bg-[#0D2B5E] hover:text-white transition-colors rounded-none"
        >
          QUAY LẠI BẢNG ĐIỀU KHIỂN
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa hồ sơ này?")) {
      try {
        await apiClient.delete(`/dossiers/${dossier._id}`);
        router.push('/dashboard');
        router.refresh(); // Cập nhật lại UI dashboard
      } catch (err) {
        alert("Lỗi khi xóa hồ sơ. Vui lòng thử lại.");
        console.error(err);
      }
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
      {/* Back Button */}
      <div className="mb-6">
        <button 
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center text-[13px] font-medium text-[#6B7A90] hover:text-[#0D2B5E] transition-colors"
        >
          <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
          </svg>
          Quay lại
        </button>
      </div>

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center flex-wrap gap-4">
          <h1 className="text-[28px] font-bold tracking-tight text-[#0D2B5E] leading-none m-0">
            {dossier.dossierId}
          </h1>
          <div 
            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.05em] rounded-none border ${getStatusColor(dossier.status)}`}
          >
            {getStatusLabel(dossier.status)}
          </div>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push(`/dossiers/${dossierId}/edit`)}
            className="px-5 py-2.5 text-[12px] font-bold tracking-[0.05em] uppercase text-[#0D2B5E] border border-[#0D2B5E] hover:bg-[#0D2B5E] hover:text-white transition-colors rounded-none"
          >
            Sửa Hồ Sơ
          </button>
          <button 
            onClick={handleDelete}
            className="px-5 py-2.5 text-[12px] font-bold tracking-[0.05em] uppercase text-red-600 border border-red-600 hover:bg-red-600 hover:text-white transition-colors rounded-none"
          >
            Xóa
          </button>
        </div>
      </div>

      {/* General Information Card */}
      <div className="bg-white border border-[#CBD5E0] rounded-none shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-[#CBD5E0] bg-[#F7F9FC]">
          <h2 className="text-[13px] font-bold tracking-[0.05em] text-[#0A1F44] uppercase m-0">
            Thông tin chung
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {/* Field: Ngày thụ lý */}
            <div className="flex flex-col border-b border-dashed border-[#E2E8F0] pb-4">
              <span className="text-[11px] font-bold tracking-[0.05em] text-[#6B7A90] uppercase mb-1.5">
                Ngày thụ lý
              </span>
              <span className="text-[14px] text-[#0A1F44] font-medium">
                {new Date(dossier.acceptanceDate).toLocaleDateString('vi-VN')}
              </span>
            </div>

            {/* Field: Ngày tạo trên hệ thống */}
            <div className="flex flex-col border-b border-dashed border-[#E2E8F0] pb-4">
              <span className="text-[11px] font-bold tracking-[0.05em] text-[#6B7A90] uppercase mb-1.5">
                Ngày tạo hệ thống
              </span>
              <span className="text-[14px] text-[#0A1F44] font-medium">
                {new Date(dossier.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>

            {/* Field: Đương sự */}
            <div className="flex flex-col border-b border-dashed border-[#E2E8F0] pb-4 md:col-span-2">
              <span className="text-[11px] font-bold tracking-[0.05em] text-[#6B7A90] uppercase mb-1.5">
                Đương sự (Người được / Người phải thi hành án)
              </span>
              <span className="text-[14px] text-[#0A1F44] font-medium leading-relaxed">
                {dossier.parties}
              </span>
            </div>

            {/* Field: Người phụ trách / Chấp hành viên */}
            <div className="flex flex-col pt-2 md:col-span-2">
              <span className="text-[11px] font-bold tracking-[0.05em] text-[#6B7A90] uppercase mb-1.5">
                Chấp hành viên phụ trách
              </span>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[#F0F2F5] border border-[#CBD5E0] flex items-center justify-center mr-3">
                  <span className="text-[12px] font-bold text-[#4A5568]">
                    {dossier.assignedOfficer?.name ? dossier.assignedOfficer.name.charAt(0) : '?'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-[#0A1F44]">
                    {dossier.assignedOfficer?.name || 'Chưa phân công'}
                  </span>
                  <span className="text-[12px] text-[#6B7A90]">
                    {dossier.assignedOfficer?.employeeId || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
