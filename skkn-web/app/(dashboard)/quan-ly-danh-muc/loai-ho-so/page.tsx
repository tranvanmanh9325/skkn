"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Pencil, Trash2, Search, Plus, Loader2 } from "lucide-react";
import RecordTypeModal from "@/components/RecordTypeModal";

// ── Types ─────────────────────────────────────────────────────────────────────
interface RecordType {
  _id: string;
  name: string;
  code: string;
  note?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function LoaiHoSoPage() {
  const [data, setData] = useState<RecordType[]>([]);
  const [filtered, setFiltered] = useState<RecordType[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RecordType | null>(null);

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<RecordType[]>(`${API_URL}/api/record-types`);
      setData(res.data);
    } catch {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side search filter
  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(
      q
        ? data.filter(
            (r) =>
              r.name.toLowerCase().includes(q) ||
              r.code.toLowerCase().includes(q)
          )
        : data
    );
  }, [search, data]);

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (row: RecordType) => {
    setEditTarget(row);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/record-types/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch {
      alert("Xóa thất bại. Vui lòng thử lại.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Quản lý loại hồ sơ</h1>
        <button
          id="btn-them-loai-ho-so"
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-[#a61c1c] hover:bg-[#8a1717] text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          <Plus size={16} />
          Thêm loại hồ sơ mới
        </button>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="relative w-full">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          id="search-loai-ho-so"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm tên loại, mã..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#a61c1c]/40 bg-white"
        />
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1">
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
                <th className="px-4 py-3 font-semibold text-gray-600">Tên loại hồ sơ</th>
                <th className="px-4 py-3 font-semibold text-gray-600 w-32">Mã</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Ghi chú</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center w-28">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr
                    key={row._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-700 font-mono text-xs px-2 py-0.5 rounded">
                        {row.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{row.note ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          title="Chỉnh sửa"
                          onClick={() => openEdit(row)}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          title="Xóa"
                          onClick={() => setDeleteId(row._id)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                        >
                          <Trash2 size={15} />
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

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      <RecordTypeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          fetchData();
        }}
        initialData={editTarget}
      />

      {/* ── Delete Confirmation Dialog ──────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80">
            <h2 className="font-semibold text-gray-800 text-base mb-2">Xác nhận xóa</h2>
            <p className="text-sm text-gray-500 mb-5">
              Bạn có chắc muốn xóa loại hồ sơ này? Hành động không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center gap-1.5"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
