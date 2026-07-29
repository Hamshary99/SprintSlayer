import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { projectService } from "@/services/project.service";
import type { Project } from "@/types";
import { getMemberColor } from "@/utils/ownerColors";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectService
      .getMyProjects()
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">S</span>
            </div>
            <span className="text-white font-bold">SprintSlayer</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Projects
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Sign out
          </button>
        </div>
      </aside>

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
              <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">
                + New Project
              </button>
            )}
          </div>

          {loading && (
            <div className="text-slate-500 py-20 text-center">Loading projects...</div>
          )}

          {!loading && projects.length === 0 && (
            <div className="text-center py-20 border border-dashed border-slate-700 rounded-xl">
              <p className="text-slate-500 mb-2">No projects yet</p>
              <p className="text-slate-600 text-sm">Create your first project to get started</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="group rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-indigo-500/40 hover:bg-slate-900/70 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{p.title}</h3>
                  <span className="text-[10px] text-slate-600 bg-slate-800 rounded px-1.5 py-0.5">#{p.id}</span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                  {p.description || "No description"}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white ring-1 ring-white/10"
                      style={{ backgroundColor: getMemberColor(p.ownerName) }}
                    >
                      {(p.ownerName || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-300">{p.ownerName || "Unknown owner"}</p>
                      <p className="text-[11px] text-slate-500">Owner</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-600">
                    {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    View &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
