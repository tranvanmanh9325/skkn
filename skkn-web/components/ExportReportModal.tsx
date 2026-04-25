"use client";

import { X, FileText, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExportReportFormValues {
  tuNgay: string;
  denNgay: string;
  coQuanNhan: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Reusable field wrapper: label + children */
function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-[#a61c1c] ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-[#a61c1c] mt-0.5">{error}</p>}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExportReportModal({ isOpen, onClose }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExportReportFormValues>({
    defaultValues: { tuNgay: "", denNgay: "", coQuanNhan: "" },
  });

  // Watch tuNgay to use as the min value constraint for denNgay validation
  const tuNgay = watch("tuNgay");

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (_data: ExportReportFormValues) => {
    setIsSubmitting(true);
    try {
      // Placeholder for real export API call in the next phase
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success("Đang kết xuất báo cáo...");
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && handleClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Xuất báo cáo</h2>
          <button
            type="button"
            aria-label="Đóng"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 pt-5 pb-4 flex flex-col gap-4">
            {/* Row 1: Từ ngày / Đến ngày */}
            <div className="grid grid-cols-2 gap-4">
              {/* Từ ngày */}
              <Field label="Từ ngày" required error={errors.tuNgay?.message}>
                <input
                  type="date"
                  id="export-tu-ngay"
                  {...register("tuNgay", { required: "Vui lòng chọn từ ngày" })}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#a61c1c] focus:border-[#a61c1c] transition-colors disabled:bg-gray-50"
                  disabled={isSubmitting}
                />
              </Field>

              {/* Đến ngày */}
              <Field label="Đến ngày" required error={errors.denNgay?.message}>
                <input
                  type="date"
                  id="export-den-ngay"
                  {...register("denNgay", {
                    required: "Vui lòng chọn đến ngày",
                    // Validate denNgay >= tuNgay only when both are filled
                    validate: (value) =>
                      !tuNgay ||
                      !value ||
                      value >= tuNgay ||
                      "Đến ngày phải lớn hơn hoặc bằng Từ ngày",
                  })}
                  min={tuNgay || undefined}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#a61c1c] focus:border-[#a61c1c] transition-colors disabled:bg-gray-50"
                  disabled={isSubmitting}
                />
              </Field>
            </div>

            {/* Row 2: Cơ quan nhận báo cáo (full width) */}
            <Field
              label="Cơ quan nhận báo cáo"
              required
              error={errors.coQuanNhan?.message}
            >
              <input
                type="text"
                id="export-co-quan-nhan"
                placeholder="Nhập cơ quan nhận báo cáo..."
                {...register("coQuanNhan", {
                  required: "Vui lòng nhập cơ quan nhận báo cáo",
                  validate: (v) =>
                    v.trim().length > 0 || "Vui lòng nhập cơ quan nhận báo cáo",
                })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#a61c1c] focus:border-[#a61c1c] transition-colors disabled:bg-gray-50"
                disabled={isSubmitting}
              />
            </Field>
          </div>

          {/* ── Footer ── */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-[#a61c1c] hover:bg-[#8a1717] text-white disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileText size={14} />
              )}
              Xuất báo cáo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
