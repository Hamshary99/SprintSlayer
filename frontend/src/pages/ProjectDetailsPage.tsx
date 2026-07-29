import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { projectService } from "@/services/project.service";
import { taskService } from "@/services/task.service";
import type { Project, Task, ProjectMember } from "@/types";
import { getMemberColor } from "@/utils/ownerColors";

const STATUS_CONFIG = {
  to_do: { label: "To Do", dot: "bg-slate-400" },
  in_progress: { label: "In Progress", dot: "bg-amber-400" },
  done: { label: "Done", dot: "bg-emerald-400" },
} as const;

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-500/10 text-red-400 ring-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
};

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<Task["status"] | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      projectService.getById(projectId),
      taskService.getByProject(projectId),
      projectService.getMembers(projectId),
    ])
      .then(([projRes, taskRes, memberRes]) => {
        setProject(projRes.data[0] ?? null);
        setTasks(taskRes.data);
        setMembers(memberRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleDragStart = (taskId: number) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, status: Task["status"]) => {
    event.preventDefault();
    setDropTargetStatus(status);
  };

  const handleDrop = async (status: Task["status"]) => {
    if (draggedTaskId === null) return;

    const taskToMove = tasks.find((task) => task.id === draggedTaskId);
    if (!taskToMove || taskToMove.status === status) {
      setDraggedTaskId(null);
      setDropTargetStatus(null);
      return;
    }

    const previousStatus = taskToMove.status;

    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === draggedTaskId ? { ...task, status } : task))
    );
    setDraggedTaskId(null);
    setDropTargetStatus(null);

    try {
      await taskService.update(draggedTaskId, { status });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Unable to move task right now.";

      setToastMessage(message);
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === draggedTaskId ? { ...task, status: previousStatus } : task))
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 gap-4">
        <p className="text-slate-400">Project not found</p>
        <Link to="/" className="text-sm text-indigo-400 hover:text-indigo-300">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {toastMessage && (
        <div
          aria-live="assertive"
          className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 shadow-lg backdrop-blur"
        >
          <p className="font-semibold">Unable to move task</p>
          <p className="mt-1 text-red-300">{toastMessage}</p>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-slate-500 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">{project.title}</h1>
              <p className="text-xs text-slate-500">{project.description || "No description"}</p>
            </div>
          </div>

          {/* Member avatars */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {members.slice(0, 5).map((m) => (
                <div
                  key={m.userId}
                  title={m.email}
                  className="h-7 w-7 rounded-full border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: getMemberColor(m.email) }}
                >
                  {m.email.charAt(0).toUpperCase()}
                </div>
              ))}
              {members.length > 5 && (
                <div className="h-7 w-7 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] text-slate-400">
                  +{members.length - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-slate-600 ml-2">{members.length} member{members.length !== 1 && "s"}</span>
          </div>
        </div>
      </header>

      {/* Kanban board */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-7xl mx-auto">
          {(Object.entries(STATUS_CONFIG) as [Task["status"], { label: string; dot: string }][]).map(
            ([status, config]) => {
              const columnTasks = tasks.filter((t) => t.status === status);
              return (
                <div
                  key={status}
                  onDragOver={(event) => handleDragOver(event, status)}
                  onDrop={() => void handleDrop(status)}
                  className={`flex flex-col rounded-xl border p-2 transition ${
                    dropTargetStatus === status ? "border-indigo-500 bg-slate-900/90" : "border-transparent"
                  }`}
                >
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <div className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
                    <h3 className="text-sm font-semibold text-slate-300">{config.label}</h3>
                    <span className="ml-auto text-xs text-slate-600 bg-slate-800/60 rounded-full px-2 py-0.5">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2.5 flex-1">
                    {columnTasks.map((t) => (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={() => handleDragStart(t.id)}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDropTargetStatus(null);
                        }}
                        className={`rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition group ${
                          draggedTaskId === t.id ? "opacity-60" : "opacity-100"
                        } hover:border-slate-700 cursor-grab`}
                      >
                        <p className="font-medium text-sm text-white mb-2">{t.title}</p>
                        {t.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3">{t.description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ring-1 ring-inset ${PRIORITY_BADGE[t.priority]}`}>
                            {t.priority}
                          </span>
                          {t.dueDate && (
                            <span className="text-[10px] text-slate-500">
                              Due {new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {columnTasks.length === 0 && (
                      <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center">
                        <p className="text-xs text-slate-600">No tasks</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
