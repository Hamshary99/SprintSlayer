import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { projectService } from "@/services/project.service";
import { taskService } from "@/services/task.service";
import { userService } from "@/services/user.service";
import { socketService } from "@/services/socket.service";
import { useAuth } from "@/context/AuthContext";
import type {
  Project,
  Task,
  ProjectMember,
  User,
  TaskStatus,
  TaskPriority,
} from "@/types";
import { getMemberColor } from "@/utils/ownerColors";
import { TaskDetailsPanel } from "@/components/projects/TaskDetailsPanel";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import { MemberManagementPanel } from "@/components/projects/MemberManagementPanel";
import { CreateTaskModal } from "@/components/projects/CreateTaskModal";
import { EditProjectModal } from "@/components/projects/EditProjectModal";

/* ─── Static config ──────────────────────────────────────────────────────── */

export const STATUS_CONFIG = {
  to_do: { label: "To Do", dot: "bg-slate-400" },
  in_progress: { label: "In Progress", dot: "bg-amber-400" },
  done: { label: "Done", dot: "bg-emerald-400" },
} as const;

export const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-500/10 text-red-400 ring-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
};



/* ─── Initial task form state ────────────────────────────────────────────── */

interface TaskForm {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  dueDate: string;
}

const EMPTY_TASK_FORM: TaskForm = {
  title: "",
  description: "",
  status: "to_do",
  priority: "medium",
  assigneeId: "",
  dueDate: "",
};

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const [isOwner, setIsOwner] = useState(false);

  /* Core data */
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  /* Kanban drag */
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<Task["status"] | null>(null);

  /* Toast */
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"error" | "success">("error");

  /* Add-member panel */
  const [showMemberPanel, setShowMemberPanel] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userSortOrder, setUserSortOrder] = useState<"asc" | "desc">("asc");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  /* Add-task modal */
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskForm>(EMPTY_TASK_FORM);
  const [submittingTask, setSubmittingTask] = useState(false);

  /* Task details */
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  /* Delete & Edit project */
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);

  /* ── Helpers ──────────────────────────────────────────────────────────── */

  const showToast = useCallback((msg: string, type: "error" | "success" = "error") => {
    setToastMessage(msg);
    setToastType(type);
  }, []);

  const refreshMembers = useCallback(async () => {
    if (!projectId) return;
    const res = await projectService.getMembers(projectId, { limit: 100 });
    setMembers(res.data);
  }, [projectId]);

  const refreshTasks = useCallback(async () => {
    if (!projectId) return;
    const res = await taskService.getByProject(projectId, { limit: 100 });
    setTasks(res.data);
  }, [projectId]);

  /* ── Initial load ────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!Number.isInteger(projectId) || projectId <= 0) {
      setLoading(false);
      return;
    }

    Promise.all([
      projectService.getById(projectId),
      taskService.getByProject(projectId, { limit: 100 }),
      projectService.getMembers(projectId, { limit: 100 }),
    ])
      .then(([projRes, taskRes, memberRes]) => {
        setProject(projRes.data[0] ?? null);
        setIsOwner(projRes.data[0]?.ownerId === currentUser?.id);
        setTasks(taskRes.data);
        setMembers(memberRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  /* ── Real-Time Socket.IO Listeners ───────────────────────────────────── */

  useEffect(() => {
    if (!Number.isInteger(projectId) || projectId <= 0) return;

    const socket = socketService.connect();
    socket.emit("join_project", projectId);

    const handleTaskCreated = (newTask: Task) => {
      if (Number(newTask.projectId) === projectId) {
        setTasks((prev) => {
          if (prev.some((t) => t.id === newTask.id)) return prev;
          return [newTask, ...prev];
        });
      }
    };

    const handleTaskUpdated = (updatedTask: Task) => {
      if (Number(updatedTask.projectId) === projectId) {
        setTasks((prev) =>
          prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
        );
      }
    };

    const handleTaskDeleted = ({ id, projectId: pId }: { id: number; projectId: number }) => {
      if (Number(pId) === projectId) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    };

    socket.on("task:created", handleTaskCreated);
    socket.on("task:updated", handleTaskUpdated);
    socket.on("task:deleted", handleTaskDeleted);

    return () => {
      socket.emit("leave_project", projectId);
      socket.off("task:created", handleTaskCreated);
      socket.off("task:updated", handleTaskUpdated);
      socket.off("task:deleted", handleTaskDeleted);
    };
  }, [projectId]);

  /* ── Toast auto-dismiss ──────────────────────────────────────────────── */

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  /* ── Fetch users when member panel opens ─────────────────────────────── */

  const fetchUsers = useCallback(
    async (search: string, sortOrder: "asc" | "desc") => {
      setLoadingUsers(true);
      try {
        const res = await userService.getAll({
          limit: 100,
          search: search || undefined,
          sortBy: "name",
          sortOrder,
        });
        setAllUsers(res.data.users ?? (res.data as unknown as User[]));
      } catch {
        setAllUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (showMemberPanel) {
      fetchUsers(userSearch, userSortOrder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMemberPanel]);

  const handleUserSearchChange = (value: string) => {
    setUserSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchUsers(value, userSortOrder);
    }, 300);
  };

  const toggleSortOrder = () => {
    const next = userSortOrder === "asc" ? "desc" : "asc";
    setUserSortOrder(next);
    fetchUsers(userSearch, next);
  };



  const handleAddMember = async (userId: number) => {
    setBusyUserId(userId);
    try {
      await projectService.addMember(projectId, userId);
      await refreshMembers();
      showToast("Member added successfully", "success");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to add member";
      showToast(msg);
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    setBusyUserId(userId);
    try {
      await projectService.removeMember(projectId, userId);
      await refreshMembers();
      showToast("Member removed", "success");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to remove member";
      showToast(msg);
    } finally {
      setBusyUserId(null);
    }
  };

  /* ── Add task ────────────────────────────────────────────────────────── */

  const handleTaskFormChange = (
    field: keyof TaskForm,
    value: string,
  ) => {
    setTaskForm((prev) => ({ ...prev, [field]: value }));
  };

  const openTaskModal = (initialStatus: TaskStatus = "to_do") => {
    setTaskForm({ ...EMPTY_TASK_FORM, status: initialStatus });
    setShowTaskModal(true);
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) return;
    setSubmittingTask(true);
    try {
      await taskService.create({
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || undefined,
        status: taskForm.status,
        priority: taskForm.priority,
        assigneeId: taskForm.assigneeId ? Number(taskForm.assigneeId) : undefined,
        dueDate: taskForm.dueDate || undefined,
        projectId,
      });
      await refreshTasks();
      setTaskForm(EMPTY_TASK_FORM);
      setShowTaskModal(false);
      showToast("Task created successfully", "success");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to create task";
      showToast(msg);
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleUpdateTask = async (id: number, data: any) => {
    try {
      const res = await taskService.update(id, data);
      
      // Update task in state directly to avoid refetching everything
      const updatedTask = res.data[0];
      setTasks((prevTasks) => 
        prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
      
      // Also update selectedTask if it's currently open
      setSelectedTask((prev) => (prev?.id === updatedTask.id ? updatedTask : prev));
      
      showToast("Task updated successfully", "success");
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await taskService.delete(taskId);
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
      showToast("Task deleted successfully", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to delete task");
    }
  };

  /* ── Delete & Edit project ────────────────────────────────────────────── */

  const navigate = useNavigate();

  const handleDeleteProject = async () => {
    if (!project) return;
    setIsDeleting(true);
    try {
      await projectService.delete(project.id);
      showToast("Project deleted successfully", "success");
      navigate("/");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to delete project");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleUpdateProject = async (id: number, data: any) => {
    try {
      const res = await projectService.update(id, data);
      setProject(res.data[0]);
      showToast("Project updated successfully", "success");
    } catch (err: any) {
      throw err;
    }
  };

  /* ── Kanban drag-and-drop ────────────────────────────────────────────── */

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
      prevTasks.map((task) => (task.id === draggedTaskId ? { ...task, status } : task)),
    );
    setDraggedTaskId(null);
    setDropTargetStatus(null);

    try {
      await taskService.update(draggedTaskId, { status });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Unable to move task right now.";

      showToast(message);
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === draggedTaskId ? { ...task, status: previousStatus } : task,
        ),
      );
    }
  };

  /* ── Loading / Not-found states ──────────────────────────────────────── */

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

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toastMessage && (
        <div
          aria-live="assertive"
          className={`fixed right-4 top-4 z-[100] max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur transition-all animate-[slideIn_0.25s_ease-out] ${
            toastType === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          <p className="font-semibold">{toastType === "success" ? "Success" : "Error"}</p>
          <p className={`mt-1 ${toastType === "success" ? "text-emerald-300" : "text-red-300"}`}>
            {toastMessage}
          </p>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-slate-500 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">{project.title}</h1>
              <p className="text-xs text-slate-500">{project.description || "No description"}</p>
            </div>
          </div>

          {/* Member avatars + Add-member button */}
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
            <span className="text-xs text-slate-600 ml-2">
              {members.length} member{members.length !== 1 && "s"}
            </span>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowMemberPanel(true)}
                className="ml-2 flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-600 text-slate-400 transition hover:border-indigo-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                title="Manage members"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}

            {/* Edit / Delete project — owner only */}
            {isAdmin && isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => setShowEditProjectModal(true)}
                  title="Edit project"
                  className="ml-2 flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-indigo-600/60 text-indigo-400 transition hover:border-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(true)}
                  title="Delete project"
                  className="ml-1 flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-red-800/60 text-red-500/60 transition hover:border-red-500 hover:text-red-400 hover:bg-red-500/10"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </>
            )}

            {/* Not-owner message for non-owning admins */}
            {isAdmin && !isOwner && (
              <span className="ml-2 text-[10px] text-slate-600 italic" title="You can view but not delete this project — you are not the owner">
                Not your project
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Board controls ─────────────────────────────────────────────── */}
      <div className="p-6">
        {isAdmin && (
          <div className="max-w-7xl mx-auto mb-5 flex justify-end">
            <button
              type="button"
              onClick={() => openTaskModal()}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 hover:shadow-indigo-500/30 active:scale-[0.97]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
          </div>
        )}

        {/* ── Kanban board ───────────────────────────────────────────── */}
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
                    dropTargetStatus === status
                      ? "border-indigo-500 bg-slate-900/90"
                      : "border-transparent"
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
                        onClick={() => setSelectedTask(t)}
                        className={`rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition group ${
                          draggedTaskId === t.id ? "opacity-60" : "opacity-100"
                        } hover:border-slate-700 cursor-pointer active:cursor-grab`}
                      >
                        <p className="font-medium text-sm text-white mb-2">{t.title}</p>
                        {t.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3">{t.description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-medium rounded-full px-2 py-0.5 ring-1 ring-inset ${PRIORITY_BADGE[t.priority]}`}
                          >
                            {t.priority}
                          </span>
                          {t.dueDate && (
                            <span className="text-[10px] text-slate-500">
                              Due{" "}
                              {new Date(t.dueDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                          {t.assigneeId && (() => {
                            const assignee = members.find((m) => m.userId === t.assigneeId);
                            if (!assignee) return null;
                            return (
                              <div
                                title={`Assigned to ${assignee.email}`}
                                className="ml-auto h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 border border-slate-900"
                                style={{ backgroundColor: getMemberColor(assignee.email) }}
                              >
                                {assignee.email.charAt(0).toUpperCase()}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                    {columnTasks.length === 0 && (
                      <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center flex flex-col items-center justify-center">
                        <svg className="w-8 h-8 text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-xs text-slate-500 font-medium">No tasks yet</p>
                      </div>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => openTaskModal(status)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700/60 p-2 text-xs font-medium text-slate-500 transition hover:border-slate-500 hover:text-slate-300 hover:bg-slate-800/50 mt-1"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Task
                      </button>
                    )}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MEMBER MANAGEMENT PANEL
         ═══════════════════════════════════════════════════════════════════ */}
      <MemberManagementPanel
        isOpen={showMemberPanel}
        onClose={() => setShowMemberPanel(false)}
        members={members}
        allUsers={allUsers}
        loadingUsers={loadingUsers}
        userSearch={userSearch}
        userSortOrder={userSortOrder}
        busyUserId={busyUserId}
        isOwner={isOwner}
        currentUserId={currentUser?.id}
        onSearchChange={handleUserSearchChange}
        onToggleSort={toggleSortOrder}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          CREATE TASK MODAL
         ═══════════════════════════════════════════════════════════════════ */}
      <CreateTaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        taskForm={taskForm}
        members={members}
        submittingTask={submittingTask}
        onChange={handleTaskFormChange}
        onSubmit={handleCreateTask}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          TASK DETAILS SLIDE-OVER PANEL
         ═══════════════════════════════════════════════════════════════════ */}
      <TaskDetailsPanel
        task={selectedTask}
        members={members}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={isAdmin ? handleDeleteTask : undefined}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          DELETE PROJECT DIALOG
         ═══════════════════════════════════════════════════════════════════ */}
      {showDeleteDialog && project && (
        <DeleteProjectDialog
          projectTitle={project.title}
          onConfirm={handleDeleteProject}
          onClose={() => setShowDeleteDialog(false)}
          isDeleting={isDeleting}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          EDIT PROJECT MODAL
         ═══════════════════════════════════════════════════════════════════ */}
      {showEditProjectModal && project && (
        <EditProjectModal
          project={project}
          isOpen={showEditProjectModal}
          onClose={() => setShowEditProjectModal(false)}
          onSave={handleUpdateProject}
        />
      )}

      {/* ── Keyframe animations ────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
