import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";

export default function RedirectGoogle() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const exchangeStarted = useRef(false);

  useEffect(() => {
    alert("Redirect url is running ");
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

        const { access_token } = response.data;

        if (!access_token) {
          throw new Error("Access token missing");
        }

        localStorage.setItem("access_token", access_token);

        toast.success("Google login successful");

        navigate("/dashboard", {
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
    <div
      style={{
        height: "100vh",
        display: "grid",
        placeItems: "center",
      }}
    >
      <p>Signing you in...</p>
    </div>
  );
}
