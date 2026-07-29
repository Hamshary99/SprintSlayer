import type { Task, ProjectMember } from "@/types";
import { getMemberColor } from "@/utils/ownerColors";
import { PRIORITY_BADGE, STATUS_CONFIG } from "@/pages/ProjectDetailsPage";
import { EditTaskModal } from "@/components/projects/EditTaskModal";
import { useState } from "react";

interface TaskDetailsPanelProps {
  task: Task | null;
  members: ProjectMember[];
  onClose: () => void;
  onUpdateTask?: (id: number, data: any) => Promise<void>;
}

export function TaskDetailsPanel({ task, members, onClose, onUpdateTask }: TaskDetailsPanelProps) {
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-slate-900/95 border-l border-slate-700/50 backdrop-blur-xl shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Task Details</h2>
          </div>
          <div className="flex items-center gap-2">
            {onUpdateTask && (
              <button
                type="button"
                onClick={() => setShowEditTaskModal(true)}
                className="rounded-lg p-1.5 text-indigo-400/80 transition hover:bg-indigo-500/10 hover:text-indigo-400"
                title="Edit Task"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
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
        </div>

        {/* Task Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-3">{task.title}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ring-1 ring-inset ${PRIORITY_BADGE[task.priority]}`}>
                {task.priority.toUpperCase()}
              </span>
              <span className="text-xs font-medium rounded-full px-2.5 py-0.5 ring-1 ring-inset ring-slate-500/20 bg-slate-500/10 text-slate-300">
                {STATUS_CONFIG[task.status].label}
              </span>
            </div>
          </div>

          {task.description && (
            <div>
              <h4 className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Description</h4>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Assignee</h4>
              <div className="flex items-center gap-2">
                {(() => {
                  const assignee = members.find((m) => m.userId === task.assigneeId);
                  if (!assignee) return <span className="text-sm text-slate-400">Unassigned</span>;
                  return (
                    <>
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: getMemberColor(assignee.email) }}
                      >
                        {assignee.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-300 truncate">{assignee.email}</span>
                    </>
                  );
                })()}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Due Date</h4>
              <span className="text-sm text-slate-300">
                {task.dueDate ? (
                  new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                ) : (
                  <span className="text-slate-500">No due date</span>
                )}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Created</h4>
            <span className="text-sm text-slate-400">
              {new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {showEditTaskModal && onUpdateTask && (
        <EditTaskModal
          task={task}
          isOpen={showEditTaskModal}
          onClose={() => setShowEditTaskModal(false)}
          members={members}
          onSave={onUpdateTask}
        />
      )}
    </div>
  );
}
