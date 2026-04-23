"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { X, Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface UnitTypeData {
  _id?: string;
  name: string;
  code: string;
  description?: string;
  note?: string;
}

interface FormValues {
  name: string;
  code: string;
  description: string;
  note: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: UnitTypeData | null;
}

// Shared input/textarea base classes — extracted to keep JSX DRY
const inputBase =
  "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a61c1c]/40 focus:border-[#a61c1c] transition-colors";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ── Component ─────────────────────────────────────────────────────────────────
export default function UnitTypeModal({
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

  // Populate form when switching between create / edit modes
  useEffect(() => {
    if (isOpen) {
      reset(
        initialData
          ? {
              name: initialData.name,
              code: initialData.code,
              description: initialData.description ?? "",
              note: initialData.note ?? "",
            }
          : { name: "", code: "", description: "", note: "" }
      );
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditMode && initialData?._id) {
        await axios.put(`${API_URL}/api/unit-types/${initialData._id}`, values);
      } else {
        await axios.post(`${API_URL}/api/unit-types`, values);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err)
          ? (err.response?.data as { message?: string })?.message ??
            "Đã xảy ra lỗi. Vui lòng thử lại."
          : "Đã xảy ra lỗi. Vui lòng thử lại.";

      // Surface duplicate-code errors on the code field specifically
      if (msg.includes("Mã loại nơi THA")) {
        setError("code", { message: msg });
      } else {
        setError("root", { message: msg });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-gray-900 font-semibold text-lg">
            {isEditMode ? "Chỉnh sửa loại nơi tha" : "Thêm loại nơi THA mới"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md p-1 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Form ── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="px-6 py-5 space-y-4"
        >
          {/* Root-level server error banner */}
          {errors.root && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {errors.root.message}
            </p>
          )}

          {/* Tên loại nơi THA */}
          <div className="space-y-1">
            <label
              htmlFor="modal-unit-type-name"
              className="block text-sm font-medium text-gray-700"
            >
              Tên loại nơi THA <span className="text-red-500">*</span>
            </label>
            <input
              id="modal-unit-type-name"
              type="text"
              placeholder="Nhập tên loại nơi THA..."
              {...register("name", { required: "Tên loại nơi THA là bắt buộc." })}
              className={`${inputBase} ${errors.name ? "border-red-400" : "border-gray-300"}`}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Mã loại */}
          <div className="space-y-1">
            <label
              htmlFor="modal-unit-type-code"
              className="block text-sm font-medium text-gray-700"
            >
              Mã loại <span className="text-red-500">*</span>
            </label>
            <input
              id="modal-unit-type-code"
              type="text"
              placeholder="Nhập mã loại..."
              {...register("code", { required: "Mã loại là bắt buộc." })}
              className={`${inputBase} ${errors.code ? "border-red-400" : "border-gray-300"}`}
            />
            {errors.code && (
              <p className="text-xs text-red-500">{errors.code.message}</p>
            )}
          </div>

          {/* Mô tả */}
          <div className="space-y-1">
            <label
              htmlFor="modal-unit-type-description"
              className="block text-sm font-medium text-gray-700"
            >
              Mô tả
            </label>
            <textarea
              id="modal-unit-type-description"
              rows={3}
              placeholder="Nhập mô tả..."
              {...register("description")}
              className={`${inputBase} resize-none border-gray-300`}
            />
          </div>

          {/* Ghi chú */}
          <div className="space-y-1">
            <label
              htmlFor="modal-unit-type-note"
              className="block text-sm font-medium text-gray-700"
            >
              Ghi chú
            </label>
            <textarea
              id="modal-unit-type-note"
              rows={3}
              placeholder="Nhập ghi chú..."
              {...register("note")}
              className={`${inputBase} resize-none border-gray-300`}
            />
          </div>

          {/* ── Footer actions ── */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
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
