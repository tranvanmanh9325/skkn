"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { X, Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface RecordTypeData {
  _id?: string;
  name: string;
  code: string;
  note?: string;
}

interface FormValues {
  name: string;
  code: string;
  note?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: RecordTypeData | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ── Component ─────────────────────────────────────────────────────────────────
export default function RecordTypeModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: Props) {
  const isEditMode = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  // Populate form when switching between create / edit
  useEffect(() => {
    if (isOpen) {
      reset(
        initialData
          ? { name: initialData.name, code: initialData.code, note: initialData.note ?? "" }
          : { name: "", code: "", note: "" }
      );
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditMode && initialData?._id) {
        await axios.put(`${API_URL}/api/record-types/${initialData._id}`, values);
      } else {
        await axios.post(`${API_URL}/api/record-types`, values);
      }
      onSuccess();
    } catch (err: unknown) {
      // axios.isAxiosError narrows the type so we can safely access response data
      const msg =
        axios.isAxiosError(err)
          ? (err.response?.data as { message?: string })?.message ?? "Đã xảy ra lỗi. Vui lòng thử lại."
          : "Đã xảy ra lỗi. Vui lòng thử lại.";

      // Surface duplicate-code errors on the code field specifically
      if (msg.includes("Mã loại hồ sơ")) {
        setError("code", { message: msg });
      } else {
        setError("root", { message: msg });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#a61c1c]">
          <h2 className="text-white font-semibold text-base">
            {isEditMode ? "Chỉnh sửa loại hồ sơ" : "Thêm loại hồ sơ mới"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="px-6 py-5 space-y-4">
          {/* Root-level server error */}
          {errors.root && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {errors.root.message}
            </p>
          )}

          {/* Tên loại hồ sơ */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Tên loại hồ sơ <span className="text-red-500">*</span>
            </label>
            <input
              id="modal-record-type-name"
              type="text"
              placeholder="Nhập tên loại hồ sơ"
              {...register("name", { required: "Tên loại hồ sơ là bắt buộc." })}
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a61c1c]/40 ${
                errors.name ? "border-red-400" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Mã */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Mã <span className="text-red-500">*</span>
            </label>
            <input
              id="modal-record-type-code"
              type="text"
              placeholder="VD: HS_HINH_SU"
              {...register("code", { required: "Mã là bắt buộc." })}
              className={`w-full border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#a61c1c]/40 ${
                errors.code ? "border-red-400" : "border-gray-300"
              }`}
            />
            {errors.code && (
              <p className="text-xs text-red-500">{errors.code.message}</p>
            )}
          </div>

          {/* Ghi chú */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
            <textarea
              id="modal-record-type-note"
              rows={3}
              placeholder="Nhập ghi chú (tuỳ chọn)"
              {...register("note")}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#a61c1c]/40"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm rounded-md bg-[#a61c1c] hover:bg-[#8a1717] text-white font-medium transition-colors disabled:opacity-60 flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isEditMode ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
