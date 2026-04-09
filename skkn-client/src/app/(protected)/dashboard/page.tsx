"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/axios";

interface Dossier {
  _id: string;
  dossierId: string;
  acceptanceDate: string;
  parties: string;
  status: string;
}

export default function DashboardPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalDossiers: 0,
    pendingCount: 0,
    executingCount: 0,
    completedCount: 0,
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchRecentDossiers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.get('/dossiers', {
          params: { page: 1, limit: 5 } // Chỉ lấy 5 hồ sơ gần nhất
        });
        if (isMounted) {
          setDossiers(res.data.data || []);
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

    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/dossiers/stats');
        if (isMounted && res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Lỗi khi tải thống kê:", err);
      }
    };

    fetchRecentDossiers();
    fetchStats();

    return () => {
      isMounted = false;
    };
  }, []);

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
      case 'PENDING': return 'bg-[#FEF3C7] text-[#92400E]';
      case 'EXECUTING': return 'bg-[#DBEAFE] text-[#1E40AF]';
      case 'COMPLETED': return 'bg-[#D1FAE5] text-[#065F46]';
      case 'SUSPENDED': return 'bg-[#FEE2E2] text-[#991B1B]';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="mb-8">
        <h1
          className="text-[22px] font-bold tracking-tight text-[#0A1F44] leading-none mb-2"
          style={{ letterSpacing: "-0.02em" }}
        >
          BẢNG ĐIỀU KHIỂN
        </h1>
        <p className="text-[13px] text-[#6B7A90] font-normal leading-snug">
          Tổng quan tình hình thụ lý và thi hành án.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Tổng hồ sơ", value: stats.totalDossiers.toLocaleString(), trend: "Cập nhật realtime" },
          { label: "Chờ duyệt", value: stats.pendingCount.toLocaleString(), trend: "Cần xử lý ngay" },
          { label: "Đang thi hành", value: stats.executingCount.toLocaleString(), trend: "Cập nhật realtime" },
          { label: "Đã xong", value: stats.completedCount.toLocaleString(), trend: "Cập nhật realtime" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white border border-[#CBD5E0] p-6 rounded-none flex flex-col transition-all duration-200 hover:border-[#A0AEC0]"
            style={{ boxShadow: "0 2px 8px 0 rgba(0, 30, 80, 0.04)" }}
          >
            <span className="text-[11px] font-bold tracking-[0.05em] text-[#4A5568] uppercase mb-3">
              {stat.label}
            </span>
            <span className="text-[32px] font-bold tracking-tight text-[#0A1F44] leading-none mb-3">
              {stat.value}
            </span>
            <span className="text-[11px] text-[#6B7A90]">{stat.trend}</span>
            <div className="mt-4 h-0.5 w-full bg-[#F0F2F5]">
              <div
                className="h-full bg-[#2B5CE6]"
                style={{ width: `${Math.max(30, 100 - idx * 20)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent Dossiers Area ── */}
      <div className="bg-white border border-[#CBD5E0] rounded-none flex-1 flex flex-col">
        {/* Table Header Container */}
        <div className="px-6 py-5 border-b border-[#CBD5E0] bg-[#FAFAFA] flex items-center justify-between">
          <h2 className="text-[13.5px] font-bold tracking-[0.02em] text-[#0A1F44] uppercase">
            Hồ sơ hoạt động gần đây
          </h2>
          
          <Link 
            href="/dossiers"
            className="text-[11px] font-bold tracking-[0.05em] uppercase text-[#2B5CE6] hover:text-[#2049BA] transition-colors"
          >
            Xem tất cả &rarr;
          </Link>
        </div>

        {/* Table Data */}
        <div className="flex-1 overflow-x-auto min-h-0 pb-6">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center p-12 flex-col gap-4">
              <div className="w-7 h-7 border-2 border-[#CBD5E0] border-t-[#0A1F44] animate-spin rounded-full"></div>
              <p className="text-[13px] text-[#6B7A90] font-medium tracking-tight">Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <p className="text-[13px] text-red-600 font-medium">Lỗi: {error}</p>
            </div>
          ) : dossiers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center flex-col text-center p-8 bg-white min-h-[200px]">
              <div className="w-16 h-16 border border-[#CBD5E0] bg-[#F0F2F5] flex items-center justify-center mb-5 rounded-none">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-[#A0AEC0]">
                  <path d="M4 6 H20 M4 12 H20 M4 18 H20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
                </svg>
              </div>
              <p className="text-[13.5px] font-semibold text-[#0A1F44] mb-1.5 tracking-tight">
                Chưa có dữ liệu hiển thị
              </p>
              <p className="text-[12.5px] text-[#6B7A90] max-w-sm leading-relaxed">
                Hệ thống chưa ghi nhận hồ sơ nào.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="border-b border-[#CBD5E0] bg-[#F7F9FC]">
                  <th className="px-6 py-4 text-[11px] font-bold tracking-[0.05em] text-[#4A5568] uppercase">Mã Hồ Sơ</th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-[0.05em] text-[#4A5568] uppercase">Đương Sự</th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-[0.05em] text-[#4A5568] uppercase">Ngày Thụ Lý</th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-[0.05em] text-[#4A5568] uppercase">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {dossiers.map((dossier) => (
                  <tr key={dossier._id} className="border-b border-[#E2E8F0] hover:bg-[#F7F9FC] transition-colors last:border-b-0">
                    <td className="px-6 py-4">
                      <Link 
                        href={`/dossiers/${dossier.dossierId}`}
                        className="text-[13px] font-bold text-[#2B5CE6] tracking-tight hover:underline cursor-pointer"
                      >
                        {dossier.dossierId}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-[#0A1F44] font-medium">{dossier.parties}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-[#4A5568]">
                        {new Date(dossier.acceptanceDate).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className={`inline-block px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.02em] rounded-none ${getStatusColor(dossier.status)}`}
                      >
                        {getStatusLabel(dossier.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
