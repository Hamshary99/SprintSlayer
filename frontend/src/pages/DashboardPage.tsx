import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ProjectList } from "@/components/dashboard/ProjectList";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import { useAuth } from "@/context/AuthContext";
import { projectService } from "@/services/project.service";
import type { CreateProjectRequest, Project } from "@/types";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  /* Delete flow */
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    projectService
      .getMyProjects({ limit: 100 })
      .then((res) => setProjects(res.data))
      .catch(() => setLoadError("Unable to load projects. Please refresh the page."))
      .finally(() => setLoading(false));
  }, []);

  /* Auto-dismiss toast */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const handleCreateProject = async (project: CreateProjectRequest) => {
    const response = await projectService.create(project);
    const createdProject = response.data[0];

    if (!createdProject) {
      throw new Error("The project was created but no project data was returned.");
    }

    setProjects((currentProjects) => [
      { ...createdProject, ownerName: createdProject.ownerName ?? user?.name },
      ...currentProjects,
    ]);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await projectService.delete(projectToDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setToast({ msg: `"${projectToDelete.title}" was deleted.`, type: "success" });
      setProjectToDelete(null);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to delete project.";
      setToast({ msg, type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <DashboardSidebar user={user} onLogout={logout} />

      {/* Toast */}
      {toast && (
        <div
          aria-live="assertive"
          className={`fixed right-4 top-4 z-[200] max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur animate-[slideIn_0.25s_ease-out] ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          <p className="font-semibold">{toast.type === "success" ? "Success" : "Error"}</p>
          <p className={`mt-1 ${toast.type === "success" ? "text-emerald-300" : "text-red-300"}`}>
            {toast.msg}
          </p>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Projects</h1>
              <p className="text-slate-500 text-sm mt-1">
                {projects.length} project{projects.length !== 1 && "s"}
              </p>
            </div>
            {user?.role === "admin" && (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New Project
              </button>
            )}
          </div>

          <ProjectList
            projects={projects}
            loading={loading}
            error={loadError}
            canCreate={user?.role === "admin"}
            currentUserId={user?.id}
            onDeleteProject={setProjectToDelete}
          />
        </div>
      </main>

      {isCreateOpen && (
        <CreateProjectDialog
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreateProject}
        />
      )}

      {projectToDelete && (
        <DeleteProjectDialog
          projectTitle={projectToDelete.title}
          onConfirm={handleDeleteProject}
          onClose={() => setProjectToDelete(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
