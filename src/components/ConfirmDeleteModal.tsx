"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";

export interface DeleteConfirmationRequest {
  title: string;
  itemName: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

interface ConfirmDeleteModalProps {
  request: DeleteConfirmationRequest | null;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  request,
  onCancel,
}: ConfirmDeleteModalProps) {
  return (
    <AnimatePresence>
      {request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/70 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      {request.title}
                    </h3>
                    <p className="text-xs font-mono font-bold text-red-600 dark:text-red-400 mt-0.5">
                      {request.itemName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                {request.description}
              </p>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  request.onConfirm();
                  onCancel();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-bold shadow-sm transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{request.confirmLabel || "Yes, Permanently Delete"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
