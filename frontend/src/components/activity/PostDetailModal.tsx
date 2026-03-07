"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { DiaryPostResponse } from "@/types";
import DiaryCard from "@/components/diary/DiaryCard";

interface PostDetailModalProps {
  open: boolean;
  post: DiaryPostResponse | null;
  loading?: boolean;
  onClose: () => void;
  onDelete: (postId: number) => void;
  disableNativeDrag?: boolean;
}

export default function PostDetailModal({
  open,
  post,
  loading = false,
  onClose,
  onDelete,
  disableNativeDrag = false,
}: PostDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="activity-post-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[90] overflow-y-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
          onClick={onClose}
        >
          <div className="mx-auto max-w-lg pb-10 pt-12" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex justify-end px-4">
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                aria-label="닫기"
              >
                <X size={18} className="text-white" />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              </div>
            ) : post ? (
              <DiaryCard post={post} onDelete={onDelete} disableNativeDrag={disableNativeDrag} />
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
