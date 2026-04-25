"use client";

import { useState, useEffect } from "react";
import { BarChart2, FileText, CalendarDays, Building2 } from "lucide-react";
import axios from "axios";
import ExportReportModal from "@/components/ExportReportModal";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Report {
  _id: string;
  tenBaoCao: string;
  coQuanNhan: string;
  ngayXuat: string;
  trangThai: "Hoàn thành" | "Đang xử lý";
}

// ── Constants ─────────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Report["trangThai"] }) {
  const isDone = status === "Hoàn thành";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isDone
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {status}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BaoCaoPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { data } = await axios.get<{ data: Report[] }>(
          `${API_BASE_URL}/api/reports`
        );
        setReports(data.data);
      } catch {
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Derived stats — computed from live data, no hardcoding
  const totalCount = reports.length;
  const doneCount = reports.filter((r) => r.trangThai === "Hoàn thành").length;
  const pendingCount = reports.filter((r) => r.trangThai === "Đang xử lý").length;

  return (
    <>
      <div className="bg-white rounded-lg p-6 min-h-full">
        {/* ------------------------------------------------------------------ */}
        {/* 1. Header                                                           */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart2 className="text-[#a61c1c] w-6 h-6" />
            <h1 className="text-xl font-bold text-gray-900">Báo cáo</h1>
          </div>

          <button
            id="btn-export-report"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#a61c1c] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#8b1616] transition-colors"
          >
            <FileText size={16} />
            Xuất báo cáo
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 2. Summary Cards                                                    */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-red-50">
              <FileText size={18} className="text-[#a61c1c]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Tổng báo cáo</p>
              <p className="text-xl font-bold text-gray-900">
                {isLoading ? "—" : totalCount}
              </p>
            </div>
          </div>

          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-green-50">
              <CalendarDays size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Hoàn thành</p>
              <p className="text-xl font-bold text-gray-900">
                {isLoading ? "—" : doneCount}
              </p>
            </div>
          </div>

          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-yellow-50">
              <Building2 size={18} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Đang xử lý</p>
              <p className="text-xl font-bold text-gray-900">
                {isLoading ? "—" : pendingCount}
              </p>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* 3. Data Table                                                       */}
        {/* ------------------------------------------------------------------ */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-4 pr-6 text-xs font-bold text-gray-700 uppercase whitespace-nowrap">
                  STT
                </th>
                <th className="py-4 pr-6 text-xs font-bold text-gray-700 whitespace-nowrap">
                  Tên báo cáo
                </th>
                <th className="py-4 pr-6 text-xs font-bold text-gray-700 whitespace-nowrap">
                  Cơ quan nhận
                </th>
                <th className="py-4 pr-6 text-xs font-bold text-gray-700 whitespace-nowrap">
                  Ngày xuất
                </th>
                <th className="py-4 text-xs font-bold text-gray-700 whitespace-nowrap">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-gray-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-gray-400">
                    Chưa có báo cáo nào.
                  </td>
                </tr>
              ) : (
                reports.map((report, index) => (
                  <tr
                    key={report._id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 pr-6 text-sm text-gray-800">{index + 1}</td>
                    <td className="py-4 pr-6 text-sm text-gray-800 font-medium">
                      {report.tenBaoCao}
                    </td>
                    <td className="py-4 pr-6 text-sm text-gray-600">{report.coQuanNhan}</td>
                    <td className="py-4 pr-6 text-sm text-gray-600 whitespace-nowrap">
                      {report.ngayXuat}
                    </td>
                    <td className="py-4">
                      <StatusBadge status={report.trangThai} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </>
  );
}
