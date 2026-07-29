import { LayoutGrid } from "lucide-react";
import type { User } from "@/types";

interface DashboardSidebarProps {
  readonly user: User | null;
  readonly onLogout: () => Promise<void>;
}

export function DashboardSidebar({ user, onLogout }: DashboardSidebarProps) {
  return (
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
        <div
          aria-current="page"
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium"
        >
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          Projects
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">
              {user?.name}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="w-full text-left px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
