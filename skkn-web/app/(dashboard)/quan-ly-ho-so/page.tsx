"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Folder,
  Upload,
  Plus,
  Search,
  ChevronDown,
  Edit,
  ArrowRightLeft,
  Trash2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import CreateRecordModal, { type RecordRow } from "@/components/CreateRecordModal";


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface HoSo {
  _id: string;
  soHoSo: string;
  nguoiCHA?: string;
  noiTHA: string;
  loaiNoiTHA: string;
  doiTHA: string;
  loaiHoSo: string;
  ghiChu?: string;
  ngayThiHanh?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const DEBOUNCE_MS = 500;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Controlled select with auto-populated options from live data */
function FilterSelect({
  id,
  label,
  placeholder,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-xs text-gray-600 mb-1 font-medium">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none border border-gray-300 rounded-md p-2 pr-8 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#a61c1c] focus:border-[#a61c1c] cursor-pointer"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>
    </div>
  );
}

/** Action icon buttons in each table row */
function ActionCell({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        aria-label="Chỉnh sửa"
        onClick={onEdit}
        className="hover:opacity-70 transition-opacity"
      >
        <Edit size={16} className="text-[#a61c1c]" />
      </button>
      <button
        aria-label="Chuyển hồ sơ"
        className="hover:opacity-70 transition-opacity"
      >
        <ArrowRightLeft size={16} className="text-blue-500" />
      </button>
      <button
        aria-label="Xóa hồ sơ"
        className="hover:opacity-70 transition-opacity"
      >
        <Trash2 size={16} className="text-[#a61c1c]" />
      </button>
    </div>
  );
}


/** Loading skeleton row spanning all columns */
function LoadingRow() {
  return (
    <tr>
      <td colSpan={9} className="py-12 text-center text-sm text-gray-400">
        Đang tải dữ liệu...
      </td>
    </tr>
  );
}

/** Empty state row when the API returns zero records */
function EmptyRow() {
  return (
    <tr>
      <td colSpan={9} className="py-12 text-center text-sm text-gray-400">
        Không có hồ sơ nào.
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function QuanLyHoSoPage() {
  // ── Core data state ───────────────────────────────────────────────────────
  const [records, setRecords] = useState<HoSo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecordRow | null>(null);

  // ── Selection state ───────────────────────────────────────────────────────
  const [allChecked, setAllChecked] = useState(false);
  const [checkedRows, setCheckedRows] = useState<Set<string>>(new Set());

  // ── Filter & search state ─────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNguoiCHA, setFilterNguoiCHA] = useState("");
  const [filterNoiTHA, setFilterNoiTHA] = useState("");
  const [filterDoiTHA, setFilterDoiTHA] = useState("");

  // Ref used to cancel the pending debounce timer on rapid keystrokes
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchRecords = useCallback(
    async (params: {
      search: string;
      nguoiCHA: string;
      noiTHA: string;
      doiTHA: string;
    }) => {
      const controller = new AbortController();
      try {
        setIsLoading(true);
        setError(null);

        const qs = new URLSearchParams();
        if (params.search) qs.set("search", params.search);
        if (params.nguoiCHA) qs.set("nguoiCHA", params.nguoiCHA);
        if (params.noiTHA) qs.set("noiTHA", params.noiTHA);
        if (params.doiTHA) qs.set("doiTHA", params.doiTHA);

        const url = `${API_BASE_URL}/api/records${qs.toString() ? `?${qs}` : ""}`;
        const res = await fetch(url, { signal: controller.signal });

        if (!res.ok) throw new Error(`Server responded with status ${res.status}`);

        const json: { data: HoSo[] } = await res.json();
        setRecords(json.data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("[QuanLyHoSo] fetch error:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── Initial load (no filters active) ─────────────────────────────────────
  useEffect(() => {
    fetchRecords({ search: "", nguoiCHA: "", noiTHA: "", doiTHA: "" });
  }, [fetchRecords]);

  // ── Debounced search: fires 500ms after the user stops typing ─────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchRecords({
        search: searchTerm,
        nguoiCHA: filterNguoiCHA,
        noiTHA: filterNoiTHA,
        doiTHA: filterDoiTHA,
      });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // ── Immediate refetch for select filters ──────────────────────────────────
  useEffect(() => {
    fetchRecords({
      search: searchTerm,
      nguoiCHA: filterNguoiCHA,
      noiTHA: filterNoiTHA,
      doiTHA: filterDoiTHA,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterNguoiCHA, filterNoiTHA, filterDoiTHA]);

  const handleCreateSuccess = () => {
    fetchRecords({
      search: searchTerm,
      nguoiCHA: filterNguoiCHA,
      noiTHA: filterNoiTHA,
      doiTHA: filterDoiTHA,
    });
  };


  // ── Derive unique option lists from the current full dataset ──────────────
  // We fetch the full list on initial mount, so these reflect all values in DB.
  // The options stay stable across filtered queries by keeping a separate
  // "allRecords" list — here we use the simplest approach: derive from whatever
  // the last unfiltered fetch returned (initial mount gives us all records).
  const uniqueNguoiCHA = useMemo(
    () => Array.from(new Set(records.map((r) => r.nguoiCHA).filter(Boolean) as string[])).sort(),
    [records]
  );
  const uniqueNoiTHA = useMemo(
    () => Array.from(new Set(records.map((r) => r.noiTHA).filter(Boolean))).sort(),
    [records]
  );
  const uniqueDoiTHA = useMemo(
    () => Array.from(new Set(records.map((r) => r.doiTHA).filter(Boolean))).sort(),
    [records]
  );

  // ── Checkbox helpers ──────────────────────────────────────────────────────
  const toggleAll = () => {
    if (allChecked) {
      setCheckedRows(new Set());
    } else {
      setCheckedRows(new Set(records.map((r) => r._id)));
    }
    setAllChecked((v) => !v);
  };

  const toggleRow = (id: string) => {
    setCheckedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <>
    <div className="bg-white rounded-lg p-6 min-h-full">
      {/* ------------------------------------------------------------------ */}
      {/* 1. Header                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between mb-6">
        {/* Left: icon + title */}
        <div className="flex items-center">
          <Folder className="text-[#a61c1c] w-6 h-6 mr-2" />
          <h1 className="text-xl font-bold text-gray-900">Quản lý hồ sơ</h1>
        </div>

        {/* Right: action buttons */}
        <div className="flex gap-3">
          <button
            id="btn-import-data"
            className="flex items-center gap-1.5 border border-[#a61c1c] text-[#a61c1c] bg-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <Upload size={16} />
            Nhập dữ liệu
          </button>
          <button
            id="btn-add-record"
            onClick={() => {
              setSelectedRecord(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-[#a61c1c] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#8b1616] transition-colors"
          >
            <Plus size={16} />
            Thêm hồ sơ
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Search & Filters                                                 */}
      {/* ------------------------------------------------------------------ */}
      {/* Search bar */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          id="search-ho-so"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm theo số hồ sơ hoặc người CHA..."
          className="w-full border border-gray-300 rounded-md pl-9 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#a61c1c] focus:border-[#a61c1c]"
        />
      </div>

      {/* Filter dropdowns */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <FilterSelect
          id="filter-nguoi-cha"
          label="Người CHA"
          placeholder="Tất cả người CHA"
          value={filterNguoiCHA}
          options={uniqueNguoiCHA}
          onChange={setFilterNguoiCHA}
        />
        <FilterSelect
          id="filter-noi-tha"
          label="Nơi THA"
          placeholder="Tất cả nơi THA"
          value={filterNoiTHA}
          options={uniqueNoiTHA}
          onChange={setFilterNoiTHA}
        />
        <FilterSelect
          id="filter-doi-tha"
          label="Đội THA"
          placeholder="Tất cả đội THA"
          value={filterDoiTHA}
          options={uniqueDoiTHA}
          onChange={setFilterDoiTHA}
        />
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
              {/* Checkbox */}
              <th className="py-4 pr-4 w-8">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="w-4 h-4 accent-[#a61c1c] cursor-pointer"
                  aria-label="Chọn tất cả"
                />
              </th>
              <th className="py-4 pr-6 text-xs font-bold text-gray-700 uppercase whitespace-nowrap">
                STT
              </th>
              <th className="py-4 pr-6 text-xs font-bold text-gray-700 uppercase whitespace-nowrap">
                Số hồ sơ
              </th>
              <th className="py-4 pr-6 text-xs font-bold text-gray-700 whitespace-nowrap">
                Người CHA
              </th>
              <th className="py-4 pr-6 text-xs font-bold text-gray-700 whitespace-nowrap">
                Nơi THA
              </th>
              <th className="py-4 pr-6 text-xs font-bold text-gray-700 whitespace-nowrap">
                Đội THA
              </th>
              <th className="py-4 pr-6 text-xs font-bold text-gray-700 whitespace-nowrap">
                Ghi chú
              </th>
              <th className="py-4 pr-6 text-xs font-bold text-gray-700 whitespace-nowrap">
                Ngày thi hành
              </th>
              <th className="py-4 text-xs font-bold text-gray-700 whitespace-nowrap">
                Hành động
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <LoadingRow />
            ) : records.length === 0 ? (
              <EmptyRow />
            ) : (
              records.map((row, index) => (
                <tr
                  key={row._id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 pr-4">
                    <input
                      type="checkbox"
                      checked={checkedRows.has(row._id)}
                      onChange={() => toggleRow(row._id)}
                      className="w-4 h-4 accent-[#a61c1c] cursor-pointer"
                      aria-label={`Chọn hồ sơ ${row.soHoSo}`}
                    />
                  </td>
                  {/* STT is derived from position, not stored in DB */}
                  <td className="py-4 pr-6 text-sm text-gray-800">
                    {index + 1}
                  </td>
                  <td className="py-4 pr-6 text-sm text-gray-800 font-medium whitespace-nowrap">
                    {row.soHoSo}
                  </td>
                  <td className="py-4 pr-6 text-sm text-gray-800 whitespace-nowrap">
                    {row.nguoiCHA}
                  </td>
                  <td className="py-4 pr-6 text-sm text-gray-800 max-w-[180px]">
                    {row.noiTHA}
                  </td>
                  <td className="py-4 pr-6 text-sm text-gray-800 max-w-[180px]">
                    {row.doiTHA}
                  </td>
                  <td className="py-4 pr-6 text-sm text-gray-400">
                    {row.ghiChu || "—"}
                  </td>
                  <td className="py-4 pr-6 text-sm text-gray-800 whitespace-nowrap">
                    {row.ngayThiHanh}
                  </td>
                  <td className="py-4">
                    <ActionCell
                      onEdit={() => {
                        setSelectedRecord(row as RecordRow);
                        setIsCreateModalOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Pagination Footer                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
        {/* Left: rows per page */}
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap">Số mục mỗi trang:</span>
          <div className="relative">
            <select
              id="rows-per-page"
              defaultValue="10"
              className="appearance-none border border-gray-300 rounded-md px-2 py-1 pr-6 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#a61c1c] cursor-pointer"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <ChevronDown
              size={12}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Right: page info + navigation */}
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap">
            {isLoading
              ? "Đang tải..."
              : `1–${records.length} trong ${records.length} mục`}
          </span>
          <div className="flex items-center gap-1">
            <button
              aria-label="Trang đầu"
              className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-40"
              disabled
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              aria-label="Trang trước"
              className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-40"
              disabled
            >
              <ChevronLeft size={16} />
            </button>
            <button
              aria-label="Trang sau"
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              aria-label="Trang cuối"
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>

      {isCreateModalOpen && (
        <CreateRecordModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
          recordToEdit={selectedRecord}
        />
      )}


    </>
  );
}
