import type { ProjectMember, User } from "@/types";
import { getMemberColor } from "@/utils/ownerColors";

interface MemberManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  members: ProjectMember[];
  allUsers: User[];
  loadingUsers: boolean;
  userSearch: string;
  userSortOrder: "asc" | "desc";
  busyUserId: number | null;
  isOwner: boolean;
  currentUserId?: number;
  onSearchChange: (value: string) => void;
  onToggleSort: () => void;
  onAddMember: (userId: number) => void;
  onRemoveMember: (userId: number) => void;
}

export function MemberManagementPanel({
  isOpen,
  onClose,
  members,
  allUsers,
  loadingUsers,
  userSearch,
  userSortOrder,
  busyUserId,
  isOwner,
  currentUserId,
  onSearchChange,
  onToggleSort,
  onAddMember,
  onRemoveMember,
}: MemberManagementPanelProps) {
  if (!isOpen) return null;

  const memberUserIds = new Set(members.map((m) => m.userId));

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
            <h2 className="text-base font-bold text-white">Manage Members</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {members.length} member{members.length !== 1 && "s"} in this project
            </p>
          </div>
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

        {/* Search + sort bar */}
        <div className="flex items-center gap-2 border-b border-slate-800/60 px-6 py-3">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search users by name or email…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>
          <button
            type="button"
            onClick={onToggleSort}
            title={`Sort ${userSortOrder === "asc" ? "Z → A" : "A → Z"}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/60 text-slate-400 transition hover:border-indigo-500 hover:text-indigo-400"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {userSortOrder === "asc" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m8-8v16m0 0l-4-4m4 4l4-4" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m8 8V4m0 0l-4 4m4-4l4 4" />
              )}
            </svg>
          </button>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : allUsers.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-12">No users found</p>
          ) : (
            allUsers.map((u) => {
              const isMember = memberUserIds.has(u.id);
              const isBusy = busyUserId === u.id;
              const isCurrentUser = u.id === currentUserId;

              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-slate-800/50 group"
                >
                  {/* Avatar */}
                  <div
                    className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: getMemberColor(u.email) }}
                  >
                    {(u.name || u.email).charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {u.name || "Unnamed"}
                      {isCurrentUser && (
                        <span className="ml-1.5 text-[10px] text-slate-500">(you)</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-500">{u.email}</p>
                  </div>

                  {/* Action button */}
                  {isBusy ? (
                    <div className="h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  ) : !isOwner ? (
                    <span
                      className="text-[10px] text-slate-600 italic cursor-default"
                      title="Only the project owner can add or remove members"
                    >
                      {isMember ? "Member" : "Not a member"}
                    </span>
                  ) : isMember ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/30 rounded px-2 py-0.5">
                        Member
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveMember(u.id)}
                        className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-red-400 ring-1 ring-red-500/30 bg-red-500/10 transition hover:bg-red-500/20 hover:text-red-300"
                        title="Kick member from project"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6h12a6 6 0 00-6-6zM21 12h-6" />
                        </svg>
                        Kick
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddMember(u.id)}
                      className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/30 bg-indigo-500/10 transition hover:bg-indigo-500/20 hover:text-indigo-300"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Add
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
