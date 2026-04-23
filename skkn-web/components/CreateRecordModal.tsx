"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios, { AxiosError } from "axios";
import { X, UploadCloud } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreateRecordFormData {
  // Tab 1
  soHoSo: string;
  noiTHA: string;
  loaiNoiTHA: string;
  doiTHA: string;
  nguoiCHA?: string;
  loaiHoSo: string;
  ghiChu?: string;
  // Tab 2
  hoTenCHA?: string;
  ngaySinhCHA?: string;
  gioiTinhCHA?: string;
  cmndCHA?: string;
  queQuanCHA?: string;
  diaChiCHA?: string;
}

/** Shape of a record row from the table — _id is required for PUT requests. */
export interface RecordRow extends CreateRecordFormData {
  _id: string;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  /** When provided, the modal operates in Edit mode. */
  recordToEdit?: RecordRow | null;
}

const TABS = ["Thông tin chung", "Thông tin Người CHA", "Tài liệu đính kèm"];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const DEFAULT_VALUES: CreateRecordFormData = {
  soHoSo: "",
  noiTHA: "",
  loaiNoiTHA: "",
  doiTHA: "",
  nguoiCHA: "",
  loaiHoSo: "",
  ghiChu: "",
  hoTenCHA: "",
  ngaySinhCHA: "",
  gioiTinhCHA: "",
  cmndCHA: "",
  queQuanCHA: "",
  diaChiCHA: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputBase =
  "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#a61c1c] focus:border-[#a61c1c]";

const selectBase =
  "w-full appearance-none border rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-[#a61c1c] focus:border-[#a61c1c]";

const ChevronIcon = () => (
  <svg
    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-600 ml-0.5">*</span>}
    </label>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateRecordModal({ onClose, onSuccess, recordToEdit }: Props) {
  const isEditMode = Boolean(recordToEdit);

  const [activeTab, setActiveTab] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    // Merge, deduplicating by name+size to avoid re-adding the same file
    const next = Array.from(incoming).filter(
      (f) => !selectedFiles.some((s) => s.name === f.name && s.size === f.size)
    );
    setSelectedFiles((prev) => [...prev, ...next]);
  };

  const removeFile = (index: number) =>
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRecordFormData>({ mode: "onBlur", defaultValues: DEFAULT_VALUES });

  // Populate form when switching between records or entering Edit mode.
  // Runs synchronously before paint via layout effect to prevent stale-value flash.
  useEffect(() => {
    if (recordToEdit) {
      reset(recordToEdit);
    } else {
      reset(DEFAULT_VALUES);
    }
    // Reset to first tab and clear file list each time the target record changes
    setActiveTab(0);
    setSelectedFiles([]);
    setSubmitError(null);
  }, [recordToEdit, reset]);

  const onSubmit = async (data: CreateRecordFormData) => {
    setSubmitError(null);
    try {
      if (recordToEdit) {
        await axios.put(`${API_BASE_URL}/api/records/${recordToEdit._id}`, data);
      } else {
        await axios.post(`${API_BASE_URL}/api/records`, data);
      }
      onSuccess();
      onClose();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      const msg =
        axiosErr.response?.data?.message ?? "Có lỗi xảy ra. Vui lòng thử lại.";
      setSubmitError(msg);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="flex flex-col w-[800px] max-h-[90vh] bg-white rounded-md shadow-lg">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 id="modal-title" className="text-base font-bold text-gray-900">
            {isEditMode ? "Cập nhật hồ sơ" : "Thêm hồ sơ"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Tab Row ── */}
        <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(i)}
              className={`py-3 px-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === i
                  ? "text-[#a61c1c] border-[#a61c1c]"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/*
          ── Form body (scrollable) ──
          ALL three tab panels are rendered simultaneously. Inactive panels
          are hidden via CSS so their inputs stay mounted — this prevents
          react-hook-form from losing registered values when switching tabs.
        */}
        <form
          id="create-record-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="overflow-y-auto flex-1"
        >
          {/* ── Tab 1: Thông tin chung ── */}
          <div className={activeTab === 0 ? "block" : "hidden"}>
            <div className="grid grid-cols-2 gap-4 p-6">

              {/* Số hồ sơ */}
              <div>
                <FieldLabel required>Số hồ sơ</FieldLabel>
                <input
                  id="soHoSo"
                  type="text"
                  placeholder="Nhập số hồ sơ..."
                  {...register("soHoSo", { required: "Số hồ sơ là bắt buộc" })}
                  className={`${inputBase} ${
                    errors.soHoSo ? "border-red-400 bg-red-50" : "border-gray-300"
                  }`}
                />
                {errors.soHoSo && (
                  <p className="mt-1 text-xs text-red-600">{errors.soHoSo.message}</p>
                )}
              </div>

              {/* Nơi THA */}
              <div>
                <FieldLabel required>Nơi THA</FieldLabel>
                <div className="relative">
                  <select
                    id="noiTHA"
                    {...register("noiTHA", {
                      required: "Nơi THA là bắt buộc",
                      validate: (v) => v !== "" || "Nơi THA là bắt buộc",
                    })}
                    className={`${selectBase} ${
                      errors.noiTHA
                        ? "border-red-400 bg-red-50 text-gray-700"
                        : "border-gray-300 text-gray-400"
                    }`}
                  >
                    <option value="" disabled>Chọn nơi THA</option>
                    <option value="Chi cục THA dân sự TP.HCM">Chi cục THA dân sự TP.HCM</option>
                    <option value="Chi cục THA dân sự Hà Nội">Chi cục THA dân sự Hà Nội</option>
                  </select>
                  <ChevronIcon />
                </div>
                {errors.noiTHA && (
                  <p className="mt-1 text-xs text-red-600">{errors.noiTHA.message}</p>
                )}
              </div>

              {/* Loại nơi THA */}
              <div>
                <FieldLabel required>Loại nơi THA</FieldLabel>
                <div className="relative">
                  <select
                    id="loaiNoiTHA"
                    {...register("loaiNoiTHA", {
                      required: "Loại nơi THA là bắt buộc",
                      validate: (v) => v !== "" || "Loại nơi THA là bắt buộc",
                    })}
                    className={`${selectBase} ${
                      errors.loaiNoiTHA
                        ? "border-red-400 bg-red-50 text-gray-700"
                        : "border-gray-300 text-gray-400"
                    }`}
                  >
                    <option value="" disabled>Tìm kiếm loại nơi THA...</option>
                    <option value="Cấp tỉnh">Cấp tỉnh</option>
                    <option value="Cấp huyện">Cấp huyện</option>
                  </select>
                  <ChevronIcon />
                </div>
                {errors.loaiNoiTHA && (
                  <p className="mt-1 text-xs text-red-600">{errors.loaiNoiTHA.message}</p>
                )}
              </div>

              {/* Đội THA */}
              <div>
                <FieldLabel required>Đội THA</FieldLabel>
                <div className="relative">
                  <select
                    id="doiTHA"
                    {...register("doiTHA", {
                      required: "Đội THA là bắt buộc",
                      validate: (v) => v !== "" || "Đội THA là bắt buộc",
                    })}
                    className={`${selectBase} ${
                      errors.doiTHA
                        ? "border-red-400 bg-red-50 text-gray-700"
                        : "border-gray-300 text-gray-400"
                    }`}
                  >
                    <option value="" disabled>Tìm kiếm đội THA...</option>
                    <option value="Đội 1">Đội 1</option>
                    <option value="Đội 2">Đội 2</option>
                    <option value="Đội 3">Đội 3</option>
                  </select>
                  <ChevronIcon />
                </div>
                {errors.doiTHA && (
                  <p className="mt-1 text-xs text-red-600">{errors.doiTHA.message}</p>
                )}
              </div>

              {/* Người CHA (optional) */}
              <div>
                <FieldLabel>Người CHA</FieldLabel>
                <div className="relative">
                  <select
                    id="nguoiCHA"
                    {...register("nguoiCHA")}
                    className={`${selectBase} border-gray-300 text-gray-400`}
                  >
                    <option value="">Tìm kiếm người CHA...</option>
                    <option value="Nguyễn Văn A">Nguyễn Văn A</option>
                    <option value="Trần Thị B">Trần Thị B</option>
                  </select>
                  <ChevronIcon />
                </div>
              </div>

              {/* Loại hồ sơ */}
              <div>
                <FieldLabel required>Loại hồ sơ</FieldLabel>
                <div className="relative">
                  <select
                    id="loaiHoSo"
                    {...register("loaiHoSo", {
                      required: "Loại hồ sơ là bắt buộc",
                      validate: (v) => v !== "" || "Loại hồ sơ là bắt buộc",
                    })}
                    className={`${selectBase} ${
                      errors.loaiHoSo
                        ? "border-red-400 bg-red-50 text-gray-700"
                        : "border-gray-300 text-gray-400"
                    }`}
                  >
                    <option value="" disabled>Tìm kiếm loại hồ sơ...</option>
                    <option value="Hồ sơ dân sự">Hồ sơ dân sự</option>
                    <option value="Hồ sơ hình sự">Hồ sơ hình sự</option>
                    <option value="Hồ sơ hành chính">Hồ sơ hành chính</option>
                  </select>
                  <ChevronIcon />
                </div>
                {errors.loaiHoSo && (
                  <p className="mt-1 text-xs text-red-600">{errors.loaiHoSo.message}</p>
                )}
              </div>

              {/* Ghi chú — full width */}
              <div className="col-span-2">
                <FieldLabel>Ghi chú</FieldLabel>
                <textarea
                  id="ghiChu"
                  placeholder="Nhập ghi chú..."
                  rows={4}
                  {...register("ghiChu")}
                  className={`${inputBase} border-gray-300 min-h-[100px] resize-y`}
                />
              </div>
            </div>

            {/* API-level error (e.g. duplicate soHoSo) */}
            {submitError && (
              <div className="mx-6 mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {submitError}
              </div>
            )}
          </div>

          {/* ── Tab 2: Thông tin Người CHA ── */}
          <div className={activeTab === 1 ? "block" : "hidden"}>
            <div className="grid grid-cols-2 gap-4 p-6">

              {/* Họ tên */}
              <div>
                <FieldLabel>Họ tên</FieldLabel>
                <input
                  id="hoTenCHA"
                  type="text"
                  placeholder="Nhập họ tên..."
                  {...register("hoTenCHA")}
                  className={`${inputBase} border-gray-300`}
                />
              </div>

              {/* Ngày sinh */}
              <div>
                <FieldLabel>Ngày sinh</FieldLabel>
                <input
                  id="ngaySinhCHA"
                  type="date"
                  {...register("ngaySinhCHA")}
                  className={`${inputBase} border-gray-300 text-gray-500`}
                />
              </div>

              {/* Giới tính */}
              <div>
                <FieldLabel>Giới tính</FieldLabel>
                <div className="relative">
                  <select
                    id="gioiTinhCHA"
                    {...register("gioiTinhCHA")}
                    className={`${selectBase} border-gray-300 text-gray-400`}
                  >
                    <option value="" disabled>Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                  <ChevronIcon />
                </div>
              </div>

              {/* Số CMND/CCCD */}
              <div>
                <FieldLabel>Số CMND/CCCD</FieldLabel>
                <input
                  id="cmndCHA"
                  type="text"
                  placeholder="Nhập số CMND/CCCD..."
                  {...register("cmndCHA")}
                  className={`${inputBase} border-gray-300`}
                />
              </div>

              {/* Quê quán */}
              <div>
                <FieldLabel>Quê quán</FieldLabel>
                <input
                  id="queQuanCHA"
                  type="text"
                  placeholder="Nhập quê quán..."
                  {...register("queQuanCHA")}
                  className={`${inputBase} border-gray-300`}
                />
              </div>

              {/* Nơi thường trú */}
              <div>
                <FieldLabel>Nơi thường trú</FieldLabel>
                <input
                  id="diaChiCHA"
                  type="text"
                  placeholder="Nhập nơi thường trú..."
                  {...register("diaChiCHA")}
                  className={`${inputBase} border-gray-300`}
                />
              </div>
            </div>
          </div>

          {/* ── Tab 3: Tài liệu đính kèm ── */}
          <div className={activeTab === 2 ? "block" : "hidden"}>
            <div className="p-6 space-y-4">
              {/* Dropzone */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Khu vực tải tệp lên"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  addFiles(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-[#a61c1c] bg-red-50"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                  // Reset value so re-selecting the same file triggers onChange
                  onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
                />
                <UploadCloud
                  size={48}
                  className={isDragging ? "text-[#a61c1c] mb-4" : "text-gray-400 mb-4"}
                />
                <p className="text-gray-700 font-medium">Kéo thả hoặc chọn tệp tại đây</p>
                <p className="text-xs text-gray-500 mt-2">
                  Hỗ trợ file dữ liệu, file PDF. Dung lượng tối đa 100MB.
                </p>
              </div>

              {/* File list */}
              {selectedFiles.length > 0 && (
                <ul className="space-y-1.5">
                  {selectedFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                    >
                      <span className="truncate text-gray-700" title={file.name}>
                        {file.name}
                        <span className="ml-2 text-xs text-gray-400">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label={`Xóa tệp ${file.name}`}
                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                        className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </form>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="create-record-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#a61c1c] rounded-md hover:bg-[#8b1616] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? isEditMode ? "Đang cập nhật..." : "Đang tạo..."
              : isEditMode ? "Cập nhật" : "Tạo mới"}
          </button>
        </div>
      </div>
    </div>
  );
}
