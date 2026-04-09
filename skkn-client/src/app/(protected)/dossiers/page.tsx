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

export default function DossiersPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Search States
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [meta, setMeta] = useState({ totalRecords: 0, totalPages: 1, currentPage: 1, limit: 10 });

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset về trang 1 khi tìm kiếm mới
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    const fetchDossiers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.get('/dossiers', {
          params: { page, limit, search: debouncedSearch }
        });
        if (isMounted) {
          setDossiers(res.data.data || []);
          if (res.data.meta) {
            setMeta(res.data.meta);
          }
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

    fetchDossiers();

    return () => {
      isMounted = false;
    };
  }, [page, limit, debouncedSearch]);

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
          HỒ SƠ THI HÀNH ÁN
        </h1>
        <p className="text-[13px] text-[#6B7A90] font-normal leading-snug">
          Quản lý danh sách hồ sơ thụ lý và xem chi tiết.
        </p>
      </div>

      {/* ── Table Area ── */}
      <div className="bg-white border border-[#CBD5E0] rounded-none flex-1 flex flex-col min-h-[500px]">
        {/* Table Header Container */}
        <div className="px-6 py-5 border-b border-[#CBD5E0] bg-[#FAFAFA] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="text-[13.5px] font-bold tracking-[0.02em] text-[#0A1F44] uppercase flex-shrink-0">
            Danh sách hồ sơ
          </h2>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-[#A0AEC0]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21L15.4999 15.4999M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm theo Mã hồ sơ, Đương sự..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#CBD5E0] bg-white text-[#0A1F44] placeholder-[#A0AEC0] outline-none rounded-none focus:border-[#2B5CE6] transition-colors"
                style={{ appearance: "none" }}
              />
            </div>

            <button className="text-[11px] font-bold tracking-[0.05em] uppercase text-[#2B5CE6] border border-[#2B5CE6] px-4 py-2 hover:bg-[#2B5CE6] hover:text-white transition-colors rounded-none whitespace-nowrap">
              Bộ Lọc
            </button>
            <Link 
              href="/dossiers/new"
              className="text-[11px] font-bold tracking-[0.05em] uppercase text-white bg-[#2B5CE6] border border-[#2B5CE6] px-4 py-2 hover:bg-[#2049BA] hover:border-[#2049BA] transition-colors rounded-none whitespace-nowrap"
            >
              + Thêm hồ sơ
            </Link>
          </div>
        </div>

        {/* Table Data */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center h-full min-h-[300px] flex-col gap-4">
              <div className="w-7 h-7 border-2 border-[#CBD5E0] border-t-[#0A1F44] animate-spin rounded-full"></div>
              <p className="text-[13px] text-[#6B7A90] font-medium tracking-tight">Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-8 min-h-[300px]">
              <p className="text-[13px] text-red-600 font-medium">Lỗi: {error}</p>
            </div>
          ) : dossiers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center flex-col text-center p-8 bg-white min-h-[300px]">
              <div className="w-16 h-16 border border-[#CBD5E0] bg-[#F0F2F5] flex items-center justify-center mb-5 rounded-none">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-[#A0AEC0]">
                  <path d="M4 6 H20 M4 12 H20 M4 18 H20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
                </svg>
              </div>
              <p className="text-[13.5px] font-semibold text-[#0A1F44] mb-1.5 tracking-tight">
                Chưa có dữ liệu hiển thị
              </p>
              <p className="text-[12.5px] text-[#6B7A90] max-w-sm leading-relaxed">
                Hệ thống chưa tìm thấy hồ sơ nào phù hợp.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse">
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
            </div>
          )}
        </div>

        {/* Pagination Console */}
        {!isLoading && dossiers.length > 0 && (
          <div className="px-6 py-4 border-t border-[#CBD5E0] bg-[#FAFAFA] flex items-center justify-between mt-auto">
            <span className="text-[12px] text-[#6B7A90]">
              Hiển thị <span className="font-bold text-[#0A1F44]">{meta.totalRecords === 0 ? 0 : (meta.currentPage - 1) * meta.limit + 1}</span> - <span className="font-bold text-[#0A1F44]">{Math.min(meta.currentPage * meta.limit, meta.totalRecords)}</span> trong <span className="font-bold text-[#0A1F44]">{meta.totalRecords}</span> bản ghi
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.currentPage === 1}
                className="px-3 py-1.5 border border-[#CBD5E0] bg-white text-[12px] font-medium text-[#4A5568] hover:bg-[#F0F2F5] transition-colors rounded-none disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.02em]"
              >
                {"<"} Trước
              </button>
              <span className="text-[12px] text-[#0A1F44] font-medium px-2 tracking-[0.02em]">
                Trang {meta.currentPage} / {meta.totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={meta.currentPage === meta.totalPages || meta.totalPages === 0}
                className="px-3 py-1.5 border border-[#CBD5E0] bg-white text-[12px] font-medium text-[#4A5568] hover:bg-[#F0F2F5] transition-colors rounded-none disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.02em]"
              >
                Tiếp {">"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
