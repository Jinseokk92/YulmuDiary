"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface ToastProps {
  message: string | null;
}

/** useToast 훅과 함께 사용하는 portal 기반 토스트 렌더러 */
export default function Toast({ message }: ToastProps) {
  return createPortal(
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          className="fixed bottom-24 left-1/2 z-[500] pointer-events-none"
          style={{ x: "-50%" }}
          initial={{ opacity: 0, y: 10, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.94 }}
          transition={{ duration: 0.18 }}
        >
          <div className="px-4 py-2.5 rounded-xl text-sm font-medium text-white whitespace-nowrap shadow-lg"
            style={{ background: "rgba(15,23,42,0.92)" }}>
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
