import { Link } from "react-router-dom";
import type { Project } from "@/types";
import { getMemberColor } from "@/utils/ownerColors";

interface ProjectCardProps {
  readonly project: Project;
  readonly isOwner?: boolean;
  readonly onDeleteClick?: (project: Project) => void;
}

export function ProjectCard({ project, isOwner, onDeleteClick }: ProjectCardProps) {
  const ownerName = project.ownerName || "Unknown owner";

  return (
    <div className="relative group">
      <Link
        to={`/projects/${project.id}`}
        className="block rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-indigo-500/40 hover:bg-slate-900/70 transition-all"
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors pr-8">
            {project.title}
          </h3>
          <span className="text-[10px] text-slate-600 bg-slate-800 rounded px-1.5 py-0.5 shrink-0">
            #{project.id}
          </span>
        </div>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4">
          {project.description || "No description"}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white ring-1 ring-white/10"
              style={{ backgroundColor: getMemberColor(project.ownerName) }}
            >
              {(project.ownerName || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-300">{ownerName}</p>
              <p className="text-[11px] text-slate-500">Owner</p>
            </div>
          </div>
          <span className="text-xs text-slate-600">
            {new Date(project.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-end">
          <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
            View &rarr;
          </span>
        </div>
      </Link>

      {/* Delete button — only shown to the owner admin */}
      {isOwner && onDeleteClick && (
        <button
          type="button"
          title="Delete project"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDeleteClick(project);
          }}
          className="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-md text-slate-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/15 hover:text-red-400 focus:opacity-100"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
