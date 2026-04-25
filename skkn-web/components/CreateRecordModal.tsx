"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
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

/** Generic master data item used for all relational dropdowns. */
export interface MasterDataItem {
  _id: string;
  name: string;
}

/** Subject (Người CHA) — full personal fields returned by the API after removing populate projection. */
export interface SubjectItem {
  _id: string;
  hoTen: string;
  ngaySinh?: string;   // ISO date string after JSON serialisation
  gioiTinh?: string;
  cccd?: string;
  queQuan?: string;
  thuongTru?: string;
}

/** Persisted attachment returned by the API / Cloudinary upload response. */
export interface AttachmentItem {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  publicId?: string;
}

/** Tracks a file currently being uploaded to Cloudinary. */
interface UploadingFile {
  /** Stable key for React reconciliation. */
  id: string;
  file: File;
  /** 0–100 percent. */
  progress: number;
  error?: string;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  /** When provided, the modal operates in Edit mode. */
  recordToEdit?: RecordRow | null;
  /** The fully-populated record from the API, used as a fallback for auto-fill
   *  when subjectOptions haven’t finished loading yet on modal open. */
  initialData?: { nguoiCHA?: SubjectItem | null; attachments?: AttachmentItem[] } | null;
  /** Master data arrays fetched by the parent page — used to populate selects. */
  unitOptions: MasterDataItem[];       // noiTHA (Unit)
  unitTypeOptions: MasterDataItem[];   // loaiNoiTHA (UnitType)
  teamOptions: MasterDataItem[];       // doiTHA (Team)
  recordTypeOptions: MasterDataItem[]; // loaiHoSo (RecordType)
  subjectOptions: SubjectItem[];       // nguoiCHA (Subject)
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

/**
 * Extracts a plain string ID from a field that may arrive as either a string
 * or a populated Mongoose object `{ _id: string; name: string }`.
 * Guards against accidental object-type values slipping through from the API.
 */
function resolveId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)._id);
  }
  return "";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateRecordModal({
  onClose,
  onSuccess,
  recordToEdit,
  initialData,
  unitOptions,
  unitTypeOptions,
  teamOptions,
  recordTypeOptions,
  subjectOptions,
}: Props) {
  const isEditMode = Boolean(recordToEdit);

  const [activeTab, setActiveTab] = useState(0);
  // Files currently uploading to Cloudinary (show progress bars)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  // Files already uploaded to Cloudinary — included in form submission as JSON
  const [uploadedFiles, setUploadedFiles] = useState<AttachmentItem[]>([]);
  // Attachments already persisted in MongoDB — displayed read-only
  const [existingFiles, setExistingFiles] = useState<AttachmentItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Immediately uploads each selected file to POST /api/upload.
   * Deduplicates by name+size against already-uploaded files.
   */
  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const deduplicated = Array.from(incoming).filter(
      (f) => !uploadedFiles.some((u) => u.fileName === f.name && u.fileSize === f.size)
    );
    deduplicated.forEach((file) => {
      const id = `${file.name}-${file.size}-${Date.now()}`;
      setUploadingFiles((prev) => [...prev, { id, file, progress: 0 }]);

      const form = new FormData();
      form.append("file", file);

      axios
        .post<{ secure_url: string; public_id: string; fileName: string; fileSize: number }>(
          `${API_BASE_URL}/api/upload`,
          form,
          {
            onUploadProgress: (evt) => {
              const pct = evt.total ? Math.round((evt.loaded * 100) / evt.total) : 0;
              setUploadingFiles((prev) =>
                prev.map((u) => (u.id === id ? { ...u, progress: pct } : u))
              );
            },
          }
        )
        .then((res) => {
          setUploadingFiles((prev) => prev.filter((u) => u.id !== id));
          setUploadedFiles((prev) => [
            ...prev,
            {
              fileName: res.data.fileName,
              fileUrl: res.data.secure_url,
              fileSize: res.data.fileSize,
              publicId: res.data.public_id,
            },
          ]);
        })
        .catch(() => {
          setUploadingFiles((prev) =>
            prev.map((u) =>
              u.id === id ? { ...u, error: "Tải lên thất bại" } : u
            )
          );
        });
    });
  };

  const removeUploadedFile = (index: number) =>
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));

  const removeExistingFile = (index: number) =>
    setExistingFiles((prev) => prev.filter((_, i) => i !== index));

  /**
   * Mở file qua Google Docs Viewer để xem trực tiếp trong tab mới.
   * Hỗ trợ PDF, Word, Excel, PowerPoint mà không cần transform Cloudinary.
   * (fl_inline không hợp lệ với resource_type "raw" — Cloudinary trả về HTTP 400)
   */
  const getViewUrl = (url: string): string => {
    if (!url) return url;
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`;
  };

  const retryUpload = (item: UploadingFile) => {
    setUploadingFiles((prev) => prev.filter((u) => u.id !== item.id));
    const dt = new DataTransfer();
    dt.items.add(item.file);
    addFiles(dt.files);
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateRecordFormData>({ mode: "onBlur", defaultValues: DEFAULT_VALUES });

  // Watch the Người CHA dropdown in Tab 1 and auto-fill Tab 2 whenever it changes.
  const selectedSubjectId = watch("nguoiCHA");

  useEffect(() => {
    // Prefer the live array (has all subjects). Fall back to the populated
    // initialData object for the edit-mode race where the array loads after
    // the modal opens and the dropdown value is already set.
    let subject = subjectOptions.find((s) => s._id === selectedSubjectId);

    if (!subject && initialData?.nguoiCHA && initialData.nguoiCHA._id === selectedSubjectId) {
      subject = initialData.nguoiCHA;
    }

    if (subject) {
      setValue("hoTenCHA", subject.hoTen ?? "");
      const formattedDate = subject.ngaySinh
        ? new Date(subject.ngaySinh).toISOString().split("T")[0]
        : "";
      setValue("ngaySinhCHA", formattedDate);
      setValue("gioiTinhCHA", subject.gioiTinh ?? "");
      setValue("cmndCHA", subject.cccd ?? "");
      setValue("queQuanCHA", subject.queQuan ?? "");
      setValue("diaChiCHA", subject.thuongTru ?? "");
    } else {
      setValue("hoTenCHA", "");
      setValue("ngaySinhCHA", "");
      setValue("gioiTinhCHA", "");
      setValue("cmndCHA", "");
      setValue("queQuanCHA", "");
      setValue("diaChiCHA", "");
    }
  }, [selectedSubjectId, subjectOptions, initialData, setValue]);

  // Normalize populated objects → string IDs before resetting the form.
  // The parent's onEdit handler already does this mapping, but resolveId()
  // acts as a type-safe safety net for any future data sources.
  useEffect(() => {
    if (recordToEdit) {
      const normalized: CreateRecordFormData = {
        ...recordToEdit,
        noiTHA: resolveId(recordToEdit.noiTHA),
        loaiNoiTHA: resolveId(recordToEdit.loaiNoiTHA),
        doiTHA: resolveId(recordToEdit.doiTHA),
        nguoiCHA: resolveId(recordToEdit.nguoiCHA),
        loaiHoSo: resolveId(recordToEdit.loaiHoSo),
      };
      reset(normalized);
    } else {
      reset(DEFAULT_VALUES);
    }
    // Reset to first tab and clear pending/uploaded files each time the target record changes
    setActiveTab(0);
    setUploadingFiles([]);
    setUploadedFiles([]);
  }, [recordToEdit, reset]);

  // Sync persisted attachments separately — initialData arrives asynchronously
  // (the parent fetches the full record AFTER setting recordToEdit), so keeping
  // this in its own effect prevents the race where attachments are always empty.
  useEffect(() => {
    console.log("[DEBUG Modal] initialData changed:", initialData);
    console.log("[DEBUG Modal] attachments:", initialData?.attachments);
    setExistingFiles(initialData?.attachments ?? []);
  }, [initialData]);

  const onSubmit = async (data: CreateRecordFormData) => {
    try {
      // Gửi JSON thuần — không cần FormData/multipart vì files đã lên Cloudinary rồi.
      // express.json() middleware ở backend xử lý request này.
      const payload: Record<string, unknown> = {};
      (Object.keys(data) as (keyof CreateRecordFormData)[]).forEach((key) => {
        const val = data[key];
        if (val !== undefined && val !== null && val !== "") {
          payload[key] = val;
        }
      });

      const allAttachments: AttachmentItem[] = [...existingFiles, ...uploadedFiles];
      console.log("[DEBUG Submit] existingFiles:", existingFiles);
      console.log("[DEBUG Submit] uploadedFiles:", uploadedFiles);
      console.log("[DEBUG Submit] allAttachments:", allAttachments);
      payload.attachments = allAttachments;

      if (recordToEdit) {
        await axios.put(`${API_BASE_URL}/api/records/${recordToEdit._id}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/api/records`, payload);
      }
      toast.success("Đã lưu hồ sơ thành công!");
      onSuccess();
      onClose();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      const msg =
        axiosErr.response?.data?.message ?? "Có lỗi xảy ra, vui lòng thử lại!";
      toast.error(msg);
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

              {/* Nơi THA — options come from the Unit collection via props */}
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
                        : "border-gray-300 text-gray-700"
                    }`}
                  >
                    <option value="">Chọn nơi THA</option>
                    {unitOptions.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
                {errors.noiTHA && (
                  <p className="mt-1 text-xs text-red-600">{errors.noiTHA.message}</p>
                )}
              </div>

              {/* Loại nơi THA — options come from the UnitType collection via props */}
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
                        : "border-gray-300 text-gray-700"
                    }`}
                  >
                    <option value="">Tìm kiếm loại nơi THA...</option>
                    {unitTypeOptions.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
                {errors.loaiNoiTHA && (
                  <p className="mt-1 text-xs text-red-600">{errors.loaiNoiTHA.message}</p>
                )}
              </div>

              {/* Đội THA — options come from the Team collection via props */}
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
                        : "border-gray-300 text-gray-700"
                    }`}
                  >
                    <option value="">Tìm kiếm đội THA...</option>
                    {teamOptions.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
                {errors.doiTHA && (
                  <p className="mt-1 text-xs text-red-600">{errors.doiTHA.message}</p>
                )}
              </div>

              {/* Người CHA (optional) — populated from /api/subjects */}
              <div>
                <FieldLabel>Người CHA</FieldLabel>
                <div className="relative">
                  <select
                    id="nguoiCHA"
                    {...register("nguoiCHA")}
                    className={`${selectBase} border-gray-300 text-gray-700`}
                  >
                    <option value="">Tìm kiếm người CHA...</option>
                    {subjectOptions.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.hoTen}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
              </div>

              {/* Loại hồ sơ — options come from the RecordType collection via props */}
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
                        : "border-gray-300 text-gray-700"
                    }`}
                  >
                    <option value="">Tìm kiếm loại hồ sơ...</option>
                    {recordTypeOptions.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
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
                    className={`${selectBase} border-gray-300 text-gray-700`}
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

              {/* Existing attachments — already saved in MongoDB.
                  User can delete them here; the full array is sent on submit. */}
              {existingFiles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Tệp đã lưu
                  </p>
                  <ul className="space-y-1.5">
                    {existingFiles.map((att, idx) => (
                      <li
                        key={`${att.fileUrl}-${idx}`}
                        className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm"
                      >
                        <a
                          href={getViewUrl(att.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-blue-700 hover:text-blue-900 hover:underline font-medium"
                          title={att.fileName}
                        >
                          {att.fileName || att.fileUrl}
                        </a>
                        <span className="ml-1 flex-shrink-0 text-xs text-blue-400">
                          ({(att.fileSize / 1024).toFixed(1)} KB)
                        </span>
                        <button
                          type="button"
                          aria-label={`Xóa tệp ${att.fileName}`}
                          onClick={() => removeExistingFile(idx)}
                          className="ml-auto flex-shrink-0 rounded p-0.5 text-gray-400 hover:bg-blue-100 hover:text-red-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dropzone — triggers immediate Cloudinary upload on selection */}
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
                className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
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
                  onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
                />
                <UploadCloud
                  size={40}
                  className={isDragging ? "text-[#a61c1c] mb-3" : "text-gray-400 mb-3"}
                />
                <p className="text-gray-700 font-medium text-sm">Kéo thả hoặc chọn tệp tại đây</p>
                <p className="text-xs text-gray-500 mt-1">
                  Tệp sẽ được tải lên ngay sau khi chọn. Dung lượng tối đa 100MB.
                </p>
              </div>

              {/* Files currently uploading — show per-file progress bars */}
              {uploadingFiles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Đang tải lên
                  </p>
                  <ul className="space-y-2">
                    {uploadingFiles.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="truncate text-gray-700 text-xs" title={item.file.name}>
                            {item.file.name}
                            <span className="ml-2 text-gray-400">
                              ({(item.file.size / 1024).toFixed(1)} KB)
                            </span>
                          </span>
                          {item.error ? (
                            <button
                              type="button"
                              onClick={() => retryUpload(item)}
                              className="ml-2 flex-shrink-0 text-xs text-[#a61c1c] underline hover:text-[#8b1616]"
                            >
                              Thử lại
                            </button>
                          ) : (
                            <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
                              {item.progress}%
                            </span>
                          )}
                        </div>
                        {item.error ? (
                          <p className="text-xs text-red-600">{item.error}</p>
                        ) : (
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-[#a61c1c] h-1.5 rounded-full transition-all duration-200"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Successfully uploaded to Cloudinary — will be saved on form submit */}
              {uploadedFiles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Tệp mới (đã tải lên)
                  </p>
                  <ul className="space-y-1.5">
                    {uploadedFiles.map((att, index) => (
                      <li
                        key={`${att.fileUrl}-${index}`}
                        className="flex items-center justify-between gap-2 rounded-md border border-green-100 bg-green-50 px-3 py-2 text-sm"
                      >
                        <span className="truncate text-green-800" title={att.fileName}>
                          {att.fileName}
                          <span className="ml-2 text-xs text-green-500">
                            ({(att.fileSize / 1024).toFixed(1)} KB)
                          </span>
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <a
                            href={getViewUrl(att.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-700 underline hover:text-green-900"
                          >
                            Xem
                          </a>
                          <button
                            type="button"
                            aria-label={`Xóa tệp ${att.fileName}`}
                            onClick={() => removeUploadedFile(index)}
                            className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
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
