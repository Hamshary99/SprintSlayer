import { LayoutGrid } from "lucide-react";
import { useState } from "react";
import type { User } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/user.service";
import { EditProfileModal } from "@/components/users/EditProfileModal";

interface DashboardSidebarProps {
  readonly user: User | null;
  readonly onLogout: () => Promise<void>;
}

export function DashboardSidebar({ user, onLogout }: DashboardSidebarProps) {
  const { updateUser } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const handleUpdateProfile = async (id: number, data: { name: string; email: string }) => {
    const res = await userService.update(id, data);
    updateUser(res.data.user);
  };

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
        <button
          type="button"
          onClick={() => setIsEditProfileOpen(true)}
          className="flex items-center gap-3 mb-3 w-full text-left rounded-lg p-1.5 transition hover:bg-slate-800 group"
        >
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white group-hover:ring-2 group-hover:ring-indigo-400 transition-all">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate group-hover:text-indigo-300 transition-colors">
              {user?.name}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="w-full text-left px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          Sign out
        </button>
      </div>

      {user && (
        <EditProfileModal
          user={user}
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          onSave={handleUpdateProfile}
        />
      )}
    </aside>
  );
}
