import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export default function RedirectGoogle() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const exchangeStarted = useRef(false);

  useEffect(() => {
    if (exchangeStarted.current) return;

    exchangeStarted.current = true;

    const code = searchParams.get("code");

    if (!code) {
      toast.error("Missing Google authorization code");
      navigate("/login", { replace: true });
      return;
    }

    const exchangeCode = async () => {
      try {
        const response = await api.post("/google/callback", {
          code,
        });

        const { access_token, is_new_user } = response.data;

        if (!access_token) {
          throw new Error("Access token missing");
        }

        setSession(access_token);

        toast.success("Google login successful");

        navigate(is_new_user ? "/profile-setup" : "/dashboard", {
          replace: true,
        });
      } catch (error) {
        console.error("Google OAuth exchange failed:", error);

        toast.error("Failed to complete Google sign in");

        navigate("/login", {
          replace: true,
        });
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  return (
    <div className="h-screen grid place-items-center">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin h-8 w-8 text-[#74007a]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm font-semibold text-slate-500">Signing you in...</p>
      </div>
    </div>
  );
}
