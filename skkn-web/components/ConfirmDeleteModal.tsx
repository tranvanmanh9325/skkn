"use client";

import { Loader2, X } from "lucide-react";
import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Hàm async do caller cung cấp — phải tự throw khi lỗi để loading state reset đúng */
  onConfirm: () => Promise<void>;
  /** Tiêu đề modal, mặc định: "Bạn có chắc chắn?" */
  title?: string;
  /** Nội dung mô tả, mặc định: "Hành động này không thể hoàn tác." */
  message?: string;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Bạn có chắc chắn?",
  message = "Hành động này không thể hoàn tác.",
}: Props) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      // Reset loading dù thành công hay lỗi;
      // toast và state cleanup do caller tự xử lý
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        {/* Title row: title bên trái, nút X bên phải */}
        <div className="flex justify-between items-start">
          <p className="font-semibold text-lg text-gray-900">{title}</p>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 -mt-0.5 ml-4 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-500 mt-2">{message}</p>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-[#a61c1c] hover:bg-[#8a1717] text-white disabled:opacity-60 transition-colors"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
