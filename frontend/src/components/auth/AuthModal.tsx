import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faEnvelope,
  faEye,
  faEyeSlash,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export function AuthModal() {
  const { authModalOpen, setAuthModalOpen, login, register } = useAuthStore();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirm: "" },
  });

  const handleLogin = async (data: LoginForm) => {
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      toast.success("Logged in successfully");
      setAuthModalOpen(false);
      loginForm.reset();
      navigate("/dashboard");
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      toast.error(detail ?? "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setSubmitting(true);
    try {
      await register(data.fullName, data.email, data.password);
      toast.success("Account created — please sign in");
      setMode("signin");
      registerForm.reset();
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      toast.error(detail ?? "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setAuthModalOpen(false)}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer z-20"
            aria-label="Close modal"
          >
            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
          </button>

          <div className="h-1.5 bg-gradient-to-r from-[#4a0080] via-[#74007a] to-[#da70dc]" />

          <div className="px-8 pt-8 pb-6">
            <h2 className="text-2xl font-bold text-[#3a0040] mb-1">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {mode === "signin"
                ? "Sign in to access your dashboard and jobs"
                : "Get started with your free account"}
            </p>

            <div className="flex mb-6 bg-slate-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  loginForm.reset();
                  registerForm.reset();
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                  mode === "signin"
                    ? "bg-white text-[#4a0080] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  loginForm.reset();
                  registerForm.reset();
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                  mode === "signup"
                    ? "bg-white text-[#4a0080] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Create Account
              </button>
            </div>

            {mode === "signin" ? (
              <form
                onSubmit={loginForm.handleSubmit(handleLogin)}
                className="flex flex-col gap-4"
              >
                <div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-300 bg-white focus-within:border-[#74007a] focus-within:ring-1 focus-within:ring-[#74007a]/20 transition-all">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="text-slate-400 text-sm w-4"
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                      {...loginForm.register("email")}
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-red-500 mt-1 ml-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-300 bg-white focus-within:border-[#74007a] focus-within:ring-1 focus-within:ring-[#74007a]/20 transition-all">
                    <FontAwesomeIcon
                      icon={faLock}
                      className="text-slate-400 text-sm w-4"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                      {...loginForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-[#74007a] transition-colors cursor-pointer"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      <FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}
                        className="text-sm"
                      />
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-red-500 mt-1 ml-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-lg bg-[#4a0080] hover:bg-[#5c00a0] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#4a0080]/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-1"
                >
                  {submitting ? "Signing in..." : "Sign In"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={registerForm.handleSubmit(handleRegister)}
                className="flex flex-col gap-4"
              >
                <div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-300 bg-white focus-within:border-[#74007a] focus-within:ring-1 focus-within:ring-[#74007a]/20 transition-all">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-slate-400 text-sm w-4"
                    />
                    <input
                      type="text"
                      placeholder="Full name"
                      className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                      {...registerForm.register("fullName")}
                    />
                  </div>
                  {registerForm.formState.errors.fullName && (
                    <p className="text-xs text-red-500 mt-1 ml-1">
                      {registerForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-300 bg-white focus-within:border-[#74007a] focus-within:ring-1 focus-within:ring-[#74007a]/20 transition-all">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="text-slate-400 text-sm w-4"
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                      {...registerForm.register("email")}
                    />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-red-500 mt-1 ml-1">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-300 bg-white focus-within:border-[#74007a] focus-within:ring-1 focus-within:ring-[#74007a]/20 transition-all">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none min-w-0"
                        {...registerForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-[#74007a] transition-colors cursor-pointer shrink-0"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        <FontAwesomeIcon
                          icon={showPassword ? faEyeSlash : faEye}
                          className="text-sm"
                        />
                      </button>
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-xs text-red-500 mt-1 ml-1">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-300 bg-white focus-within:border-[#74007a] focus-within:ring-1 focus-within:ring-[#74007a]/20 transition-all">
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Confirm"
                        className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none min-w-0"
                        {...registerForm.register("confirm")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="text-slate-400 hover:text-[#74007a] transition-colors cursor-pointer shrink-0"
                        aria-label={
                          showConfirm
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                      >
                        <FontAwesomeIcon
                          icon={showConfirm ? faEyeSlash : faEye}
                          className="text-sm"
                        />
                      </button>
                    </div>
                    {registerForm.formState.errors.confirm && (
                      <p className="text-xs text-red-500 mt-1 ml-1">
                        {registerForm.formState.errors.confirm.message}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-lg bg-[#4a0080] hover:bg-[#5c00a0] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#4a0080]/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-1"
                >
                  {submitting ? "Creating account..." : "Create Account"}
                </button>
              </form>
            )}

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-slate-400 font-medium">
                  or continue with
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                const res = await api.get("/google/login");
                window.location.href = res.data.url;
              }}
              className="w-full py-2.5 rounded-lg border-2 border-[#74007a]/30 bg-white hover:bg-[#faf5fc] text-[#74007a] font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {mode === "signin"
                ? "Sign in with Google"
                : "Sign up with Google"}
            </button>

            <p className="text-xs text-slate-400 text-center mt-4">
              {mode === "signin" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      loginForm.reset();
                    }}
                    className="text-[#74007a] font-semibold hover:text-[#da70dc] transition-colors cursor-pointer"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      registerForm.reset();
                    }}
                    className="text-[#74007a] font-semibold hover:text-[#da70dc] transition-colors cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
