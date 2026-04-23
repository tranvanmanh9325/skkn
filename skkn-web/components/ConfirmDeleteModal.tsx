"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 mx-4">
        <h2 className="text-lg font-bold text-gray-900">Bạn có chắc chắn?</h2>
        <p className="text-sm text-gray-600 mt-2">
          Hành động này không thể hoàn tác. Bản ghi sẽ bị xóa vĩnh viễn.
        </p>

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
