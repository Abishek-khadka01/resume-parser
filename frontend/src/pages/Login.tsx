import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import logo from "@/assets/logo-purple.png";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

const NAV_ITEMS = [{ to: "/login", label: "LOG IN" }];

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: localStorage.getItem("remembered_email") ?? "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);

      if (rememberMe) {
        localStorage.setItem("remembered_email", data.email);
      } else {
        localStorage.removeItem("remembered_email");
      }

      navigate("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    }
  };

  const handleGoogleLogin = async () => {
    const response = await api.get("/google/login");
    window.location.href = response.data.url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 md:p-8">
      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-4xl bg-card rounded-2xl shadow-lg ring-1 ring-border flex flex-col md:flex-row overflow-hidden min-h-135"
      >
        {/* ===== LEFT SIDE: Form ===== */}
        <div className="flex-1 flex flex-col px-8 md:px-12 py-8 md:py-10">
          {/* Top Navigation */}
          <nav
            className="flex items-center gap-6 mb-12"
            aria-label="Auth navigation"
          >
            <Link to="/" className="shrink-0 mr-4">
              <img src={logo} alt="ResuMatrix" className="h-9 w-auto" />
            </Link>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-medium tracking-wide transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Heading */}
          <h1 className="text-3xl font-semibold text-foreground mb-8">
            Log in to your account
          </h1>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4 max-w-md"
          >
            {/* Username / Email */}
            <div>
              <div className="flex items-center gap-3 px-4 h-11 rounded-xl border border-border bg-secondary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-colors">
                <FontAwesomeIcon
                  icon={faUser}
                  className="text-muted-foreground text-sm"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                  aria-label="Email address"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive mt-1 ml-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center gap-3 px-4 h-11 rounded-xl border border-border bg-secondary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-colors">
                <FontAwesomeIcon
                  icon={faLock}
                  className="text-muted-foreground text-sm"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                  aria-label="Password"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    className="text-sm"
                  />
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1 ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${
                    rememberMe
                      ? "border-primary bg-primary"
                      : "border-input"
                  }`}
                  aria-pressed={rememberMe}
                  aria-label="Remember me"
                >
                  {rememberMe && (
                    <span className="w-1.5 h-1.5 rounded-xs bg-white" />
                  )}
                </button>
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary-dark text-primary-foreground font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-1"
            >
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-11 rounded-xl border border-border bg-transparent hover:bg-secondary text-foreground font-medium text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              Continue with Google
            </button>

            {/* Sign Up Link */}
            <p className="text-sm text-muted-foreground text-center mt-1">
              Don&rsquo;t have an account?{" "}
              <Link
                to="/register"
                className="text-primary font-medium hover:underline underline-offset-4"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>

        {/* ===== RIGHT SIDE: Brand Panel ===== */}
        <div className="hidden md:flex w-[42%] bg-navbar-bg p-10 flex-col justify-center items-start text-left">
          <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center mb-6">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">
            Built around your actual resume
          </h3>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Every match score and suggestion comes from the skills and experience you
            already have — not a generic keyword checklist.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
