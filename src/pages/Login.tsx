import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "@/lib/neon-auth";

type Mode = "login" | "signup";

const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (mode === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const result =
        mode === "login"
          ? await authClient.signIn.email({ email: trimmedEmail, password })
          : await authClient.signUp.email({
              email: trimmedEmail,
              password,
              name: name.trim() || undefined,
            });

      if (result.error) {
        setError(
          result.error.message ||
            "Something went wrong. Please try again."
        );
        return;
      }

      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden px-4 sm:px-6">

      {/* Background blur shapes */}
      <div className="absolute w-48 h-48 sm:w-72 sm:h-72 bg-white/20 rounded-full blur-3xl top-10 left-5 sm:left-10"></div>
      <div className="absolute w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full blur-3xl bottom-10 right-5 sm:right-10"></div>

      {/* Card */}
      <div className="relative bg-white/90 backdrop-blur-md p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md text-center border border-white/40">

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden border">
            <img
              src="/cashtrack.png"
              alt="CashTrack Logo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          CashTrack
        </h1>
        <p className="text-gray-500 mt-2 mb-6 text-sm">
          Manage your expenses smarter
        </p>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="text-left space-y-4">
          {mode === "signup" && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className={inputClass}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? mode === "login"
                ? "Logging in..."
                : "Creating account..."
              : mode === "login"
                ? "Login"
                : "Create Account"}
          </button>
        </form>

        {/* Mode toggle */}
        <p className="text-sm text-gray-500 mt-5">
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={switchMode}
            className="text-indigo-600 font-medium hover:underline"
          >
            {mode === "login" ? "Sign up" : "Login"}
          </button>
        </p>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-6">
          Secure authentication powered by Neon Auth
        </p>
      </div>
    </div>
  );
};

export default Login;