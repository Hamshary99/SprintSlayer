import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import type { CreateProjectRequest } from "@/types";

interface CreateProjectDialogProps {
  readonly onClose: () => void;
  readonly onCreate: (project: CreateProjectRequest) => Promise<void>;
}

function getErrorMessage(error: unknown) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? "Unable to create the project. Please try again."
  );
}

export function CreateProjectDialog({
  onClose,
  onCreate,
}: CreateProjectDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const closeDialog = () => {
    if (!isCreating) onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Project title is required.");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onCreate({
        title: trimmedTitle,
        ...(description.trim() && { description: description.trim() }),
      });
      onClose();
    } catch (createError: unknown) {
      setError(getErrorMessage(createError));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close create project dialog"
        disabled={isCreating}
        onClick={closeDialog}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />
      <dialog
        open
        aria-modal="true"
        aria-labelledby="create-project-title"
        className="relative z-10 m-0 w-full max-w-lg rounded-lg border border-slate-700 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2
              id="create-project-title"
              className="text-lg font-semibold text-white"
            >
              Create project
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Set up a workspace for your team.
            </p>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            disabled={isCreating}
            aria-label="Close create project dialog"
            title="Close"
            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-5 p-6"
        >
          <div>
            <label
              htmlFor="project-title"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Project title
            </label>
            <input
              id="project-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (error) setError(null);
              }}
              autoFocus
              maxLength={120}
              placeholder="Website redesign"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="project-description"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Description{" "}
              <span className="font-normal text-slate-600">(optional)</span>
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={500}
              placeholder="What is this project about?"
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={closeDialog}
              disabled={isCreating}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !title.trim()}
              className="inline-flex min-w-32 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {isCreating ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
