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
      <div className="text-slate-500 py-20 text-center">
        Loading projects...
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
      <div className="text-center py-20 border border-dashed border-slate-700 rounded-xl">
        <p className="text-slate-500 mb-2">No projects yet</p>
        <p className="text-slate-600 text-sm">
          {canCreate ? "Create your first project to get started" : "No projects have been assigned to you"}
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
