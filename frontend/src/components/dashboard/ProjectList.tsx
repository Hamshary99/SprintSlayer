import type { Project } from "@/types";
import { ProjectCard } from "./ProjectCard";

interface ProjectListProps {
  readonly projects: Project[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly canCreate: boolean;
  readonly currentUserId?: number;
  readonly onDeleteProject?: (project: Project) => void;
}

export function ProjectList({
  projects,
  loading,
  error,
  canCreate,
  currentUserId,
  onDeleteProject,
}: ProjectListProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-5 h-[160px] animate-pulse">
            <div>
              <div className="h-5 w-2/3 bg-slate-800 rounded mb-3"></div>
              <div className="h-3 w-full bg-slate-800/60 rounded mb-2"></div>
              <div className="h-3 w-4/5 bg-slate-800/60 rounded"></div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-800/50">
              <div className="h-4 w-1/4 bg-slate-800 rounded"></div>
              <div className="h-6 w-1/3 bg-slate-800 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </p>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 border border-dashed border-slate-700/60 bg-slate-900/20 rounded-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/50 mb-4">
          <svg className="h-7 w-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-lg font-medium text-slate-300 mb-1">No projects yet</p>
        <p className="text-slate-500 text-sm max-w-sm text-center">
          {canCreate ? "Create your first project to get started and manage your team's tasks." : "No projects have been assigned to you yet. An admin needs to add you to a project."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isOwner={currentUserId !== undefined && project.ownerId === currentUserId}
          onDeleteClick={onDeleteProject}
        />
      ))}
    </div>
  );
}
