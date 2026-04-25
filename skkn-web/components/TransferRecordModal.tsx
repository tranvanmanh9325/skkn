"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, ChevronDown, Loader2, Check } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RecordForTransfer {
  _id: string;
  soHoSo: string;
  noiTHA?: { _id: string; name: string };
}

interface MasterDataItem {
  _id: string;
  name: string;
}

interface Props {
  record: RecordForTransfer;
  unitOptions: MasterDataItem[];
  onClose: () => void;
  /** Called after a successful transfer so the parent can refresh the table */
  onSuccess?: () => void;
}

type Tab = "unit" | "person";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// Placeholder — swap with real API fetch when the endpoint is ready
const MOCK_PERSONS: MasterDataItem[] = [
  { _id: "p1", name: "Nguyễn Văn A" },
  { _id: "p2", name: "Trần Thị B" },
  { _id: "p3", name: "Lê Văn C" },
];

// ---------------------------------------------------------------------------
// SearchableCombobox — headless, no extra dependencies
// ---------------------------------------------------------------------------
interface ComboboxProps {
  id: string;
  options: MasterDataItem[];
  value: MasterDataItem | null;
  placeholder: string;
  onChange: (item: MasterDataItem | null) => void;
}

function SearchableCombobox({ id, options, value, placeholder, onChange }: ComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? options.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const handleSelect = (item: MasterDataItem) => {
    onChange(item);
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    inputRef.current?.focus();
  };

  const displayValue = open ? query : (value?.name ?? "");

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center border rounded-lg bg-white transition-colors ${
          open ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-300"
        }`}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          placeholder={value ? "" : placeholder}
          value={displayValue}
          onFocus={() => {
            setOpen(true);
            // Clear display so user can type immediately without erasing first
            if (value) setQuery("");
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
            // If user types, clear the selected value so ID doesn't mismatch
            if (value) onChange(null);
          }}
          className="flex-1 px-3 py-2.5 text-sm text-gray-700 bg-transparent focus:outline-none rounded-lg"
        />

        {/* Clear button — shown only when a value is selected */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 mr-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Xóa lựa chọn"
          >
            <X size={14} />
          </button>
        )}

        <ChevronDown
          size={16}
          className={`mr-3 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* Dropdown list */}
      {open && (
        <ul className="absolute z-10 mt-1 w-full max-h-52 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400 text-center">
              Không tìm thấy kết quả.
            </li>
          ) : (
            filtered.map((opt) => (
              <li
                key={opt._id}
                onMouseDown={(e) => {
                  // Prevent input blur from firing before click registers
                  e.preventDefault();
                  handleSelect(opt);
                }}
                className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                  value?._id === opt._id
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {value?._id === opt._id && <Check size={14} className="flex-shrink-0" />}
                <span className={value?._id === opt._id ? "" : "ml-[18px]"}>{opt.name}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TransferRecordModal
// ---------------------------------------------------------------------------
export default function TransferRecordModal({ record, unitOptions, onClose, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("unit");
  const [selectedItem, setSelectedItem] = useState<MasterDataItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isUnit = activeTab === "unit";
  const options = isUnit ? unitOptions : MOCK_PERSONS;

  const handleTabChange = (tab: Tab) => {
    // Reset selection when switching tabs to avoid ID mismatch between lists
    setActiveTab(tab);
    setSelectedItem(null);
  };

  const handleTransfer = useCallback(async () => {
    if (!selectedItem) return;

    setIsLoading(true);

    try {
      // Only noiTHA is updated during a transfer — other fields are untouched.
      // The existing updateRecord controller accepts a partial body and uses
      // $set, so sending only `noiTHA` is safe and intentional.
      await axios.put(`${API_BASE_URL}/api/records/${record._id}`, {
        noiTHA: selectedItem._id,
      });

      toast.success("Chuyển hồ sơ thành công!");
      onSuccess?.();
      onClose();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? (err.response.data.message as string)
          : "Có lỗi xảy ra, vui lòng thử lại!";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedItem, record._id, onSuccess, onClose]);

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      {/* Modal box */}
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Chuyển hồ sơ</h2>
          <button
            onClick={onClose}
            aria-label="Đóng modal"
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Summary info                                                     */}
        {/* ---------------------------------------------------------------- */}
        <div className="mb-5 space-y-1">
          <p className="text-sm text-gray-700">
            Chuyển hồ sơ <span className="font-semibold">{record.soHoSo}</span> đến đơn vị được chọn.
          </p>
          <p className="text-sm text-gray-700">
            Đơn vị hiện tại: <span className="font-semibold">{record.noiTHA?.name ?? "—"}</span>
          </p>
          <p className="text-sm text-gray-700">
            Cán bộ xử lý: <span className="font-semibold">Admin</span>
          </p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Segmented tabs                                                   */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex bg-gray-100 p-1 rounded-lg mb-5">
          <button
            id="tab-unit"
            onClick={() => handleTabChange("unit")}
            className={`flex-1 text-center py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              isUnit ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Đơn vị
          </button>
          <button
            id="tab-person"
            onClick={() => handleTabChange("person")}
            className={`flex-1 text-center py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              !isUnit ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Cá nhân
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Searchable combobox                                              */}
        {/* ---------------------------------------------------------------- */}
        <div className="mb-6">
          <label
            htmlFor="transfer-target-input"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {isUnit ? "Chuyển tới đơn vị" : "Chuyển tới cá nhân"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <SearchableCombobox
            id="transfer-target-input"
            options={options}
            value={selectedItem}
            placeholder={isUnit ? "Tìm kiếm đơn vị..." : "Tìm kiếm cá nhân..."}
            onChange={setSelectedItem}
          />
        </div>



        {/* ---------------------------------------------------------------- */}
        {/* Footer buttons                                                   */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-center justify-end gap-3">
          <button
            id="btn-cancel-transfer"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Hủy
          </button>
          <button
            id="btn-confirm-transfer"
            onClick={handleTransfer}
            disabled={!selectedItem || isLoading}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#a61c1c] rounded-lg transition-colors ${
              selectedItem && !isLoading
                ? "hover:bg-[#8b1616] cursor-pointer"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            {isLoading && <Loader2 size={15} className="animate-spin" />}
            Chuyển hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
}
