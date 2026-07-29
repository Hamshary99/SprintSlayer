interface DeleteTaskDialogProps {
  taskTitle: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isDeleting: boolean;
}

export function DeleteTaskDialog({
  taskTitle,
  onConfirm,
  onClose,
  isDeleting,
}: DeleteTaskDialogProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 rounded-xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-6 animate-[scaleIn_0.25s_ease-out]">
        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 mb-4">
          <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>

        <h2 className="text-lg font-bold text-white mb-1">Delete Task</h2>
        <p className="text-sm text-slate-400 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-white">{taskTitle}</span>? This action cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition hover:text-white hover:bg-slate-800 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-red-500/20 transition hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            {isDeleting && (
              <div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            Delete Task
          </button>
        </div>
      </div>
    </div>
  );
}
