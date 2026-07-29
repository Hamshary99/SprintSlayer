import type { ProjectMember, TaskPriority, TaskStatus } from "@/types";

export interface TaskFormState {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  dueDate: string;
}

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-emerald-400",
};

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskForm: TaskFormState;
  members: ProjectMember[];
  submittingTask: boolean;
  onChange: (field: keyof TaskFormState, value: string) => void;
  onSubmit: () => Promise<void>;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  taskForm,
  members,
  submittingTask,
  onChange,
  onSubmit,
}: CreateTaskModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/50 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl animate-[scaleIn_0.25s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Create New Task</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-xs font-medium text-slate-400 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={taskForm.title}
              onChange={(e) => onChange("title", e.target.value)}
              placeholder="e.g. Implement user authentication"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-desc" className="block text-xs font-medium text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              id="task-desc"
              rows={3}
              value={taskForm.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="Add details about this task…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 resize-none"
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Status Dropdown */}
            <div>
              <label htmlFor="task-status" className="block text-xs font-medium text-slate-400 mb-1.5">
                Status
              </label>
              <select
                id="task-status"
                value={taskForm.status}
                onChange={(e) => onChange("status", e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 cursor-pointer"
              >
                <option value="to_do">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Priority Dropdown */}
            <div>
              <label htmlFor="task-priority" className="block text-xs font-medium text-slate-400 mb-1.5">
                Priority
              </label>
              <div className="relative">
                <select
                  id="task-priority"
                  value={taskForm.priority}
                  onChange={(e) => onChange("priority", e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 pr-8 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 cursor-pointer"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${PRIORITY_DOT[taskForm.priority]}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Assignee + Due Date row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Assignee */}
            <div>
              <label htmlFor="task-assignee" className="block text-xs font-medium text-slate-400 mb-1.5">
                Assignee
              </label>
              <select
                id="task-assignee"
                value={taskForm.assigneeId}
                onChange={(e) => onChange("assigneeId", e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="task-due" className="block text-xs font-medium text-slate-400 mb-1.5">
                Due Date
              </label>
              <input
                id="task-due"
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => onChange("dueDate", e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition hover:text-white hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={!taskForm.title.trim() || submittingTask}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            {submittingTask && (
              <div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}
