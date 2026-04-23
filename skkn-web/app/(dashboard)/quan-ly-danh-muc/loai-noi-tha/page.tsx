"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Pencil, Trash2, Search, Plus, Loader2, Tag } from "lucide-react"; // Loader2 still used for table loading state
import {
  FiChevronsLeft,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsRight,
} from "react-icons/fi";
import UnitTypeModal, { UnitTypeData } from "@/components/UnitTypeModal";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";

// ── Page-level type (extends UnitTypeData with required _id) ──────────────────
interface UnitType extends Required<Pick<UnitTypeData, "_id">> {
  name: string;
  code: string;
  description?: string;
  note?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export default function LoaiNoiThaPage() {
  const [data, setData] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UnitType | null>(null);

  // Delete confirmation
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Data fetching (server-side search via ?q=) ────────────────────────────
  const fetchData = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = q.trim() ? { q: q.trim() } : {};
      const res = await axios.get<UnitType[]>(`${API_URL}/api/unit-types`, { params });
      setData(res.data);
      setCurrentPage(1); // reset to first page on new search
    } catch {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(appliedSearch);
  }, [appliedSearch, fetchData]);

  const handleSearch = () => {
    setAppliedSearch(searchInput);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  // ── Pagination helpers ────────────────────────────────────────────────────
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, totalItems);
  const paginatedData = data.slice((safePage - 1) * pageSize, safePage * pageSize);

  const goToPage = (page: number) =>
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (row: UnitType) => {
    setEditTarget(row);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await axios.delete(`${API_URL}/api/unit-types/${itemToDelete}`);
    setItemToDelete(null);
    fetchData(appliedSearch);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Main card ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-[#a61c1c]" />
            <h1 className="text-xl font-bold text-gray-800">Quản lý loại nơi THA</h1>
          </div>
          <button
            id="btn-them-loai-noi-tha"
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-[#a61c1c] hover:bg-[#8a1717] text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            <Plus size={16} />
            Thêm loại nơi THA mới
          </button>
        </div>

        {/* ── Search bar ───────────────────────────────────────────────────── */}
        <div className="flex gap-2">
          <input
            id="search-loai-noi-tha"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Tìm kiếm theo tên, mã..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a61c1c]/40 bg-white"
          />
          <button
            id="btn-search-loai-noi-tha"
            onClick={handleSearch}
            className="flex items-center gap-1.5 bg-[#a61c1c] hover:bg-[#8a1717] text-white text-sm font-medium px-4 py-2 rounded-md transition-colors whitespace-nowrap"
          >
            <Search size={15} />
            Tìm kiếm
          </button>
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-2 text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Đang tải dữ liệu...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600 w-14">STT</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Tên loại nơi THA</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 w-32">Mã loại</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Mô tả</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Ghi chú</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center w-28">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr
                      key={row._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-2 text-gray-500">
                        {(safePage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-4 py-2 font-medium text-gray-800">{row.name}</td>
                      <td className="px-4 py-2">
                        <span className="bg-blue-50 text-blue-700 font-mono text-xs px-2 py-0.5 rounded">
                          {row.code}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500">{row.description || "-"}</td>
                      <td className="px-4 py-2 text-gray-500">{row.note || "-"}</td>
                      <td className="px-4 py-2">
                        <div className="inline-flex items-center justify-center gap-1">
                          <button
                            title="Chỉnh sửa"
                            onClick={() => openEdit(row)}
                            className="p-1 rounded hover:bg-red-50 text-[#a61c1c] transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            title="Xóa"
                            onClick={() => setItemToDelete(row._id)}
                            className="p-1 rounded hover:bg-red-50 text-[#a61c1c] transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination footer ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-0">
          {/* Left: items-per-page */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Số mục mỗi trang:</span>
            <select
              id="page-size-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#a61c1c]/40 bg-white"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Right: range + navigation */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {totalItems === 0 ? "0 mục" : `${pageStart}–${pageEnd} trong ${totalItems} mục`}
            </span>
            <div className="flex items-center gap-1">
              <button
                title="Trang đầu"
                onClick={() => goToPage(1)}
                disabled={safePage === 1}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronsLeft size={16} />
              </button>
              <button
                title="Trang trước"
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage === 1}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronLeft size={16} />
              </button>
              <button
                title="Trang sau"
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage === totalPages}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronRight size={16} />
              </button>
              <button
                title="Trang cuối"
                onClick={() => goToPage(totalPages)}
                disabled={safePage === totalPages}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────────────────────── */}
      <UnitTypeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          fetchData(appliedSearch);
        }}
        initialData={editTarget}
      />

      {/* ── Delete Confirmation Modal ─────────────────────────────────────────── */}
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
