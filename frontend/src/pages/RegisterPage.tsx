import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, name, role);
      navigate("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-500 flex items-center justify-center">
            <span className="text-white font-black text-lg">S</span>
          </div>
          <span className="text-white text-xl font-bold tracking-tight">SprintSlayer</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Join the team.
          </h2>
          <p className="text-slate-400 text-lg max-w-md">
            Set up your account in seconds and start managing your projects right away.
          </p>
        </div>
        <p className="text-slate-600 text-sm">&copy; 2026 SprintSlayer</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center bg-slate-950 px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="h-9 w-9 rounded-lg bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-black">S</span>
            </div>
            <span className="text-white text-lg font-bold">SprintSlayer</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-slate-500 mb-8">Fill in your details to get started</p>

          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Account Type</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setRole("member")}
                  className={`py-2 text-sm font-medium rounded-md transition ${
                    role === "member"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Member
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`py-2 text-sm font-medium rounded-md transition ${
                    role === "admin"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="register-name" className="block text-sm font-medium text-slate-300 mb-2">Full name</label>
              <input
                id="register-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
              />
            </div>
            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
              />
            </div>
            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                id="register-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars, mixed case + number"
                className="w-full rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition mt-2"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
