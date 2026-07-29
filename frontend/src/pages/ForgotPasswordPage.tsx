import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { authService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await authService.forgotPassword(email.trim());
      setMessage(response.data.message);
    } catch (requestError: unknown) {
      const requestMessage =
        (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Unable to request a password reset.";
      setError(requestMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-sm">
        <Link to="/login" className="mb-10 inline-block text-sm text-slate-500 hover:text-white">
          &larr; Back to sign in
        </Link>
        <h1 className="text-2xl font-bold text-white">Reset your password</h1>
        <p className="mb-8 mt-2 text-sm text-slate-500">
          Enter your email and we will send you a reset link.
        </p>

        {message ? (
          <p role="status" className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </p>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
            {error && (
              <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}
            <div>
              <label htmlFor="reset-email" className="mb-2 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}