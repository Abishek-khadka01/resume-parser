import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { Navbar } from "@/components/layout/Navbar";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import JobBoard from "@/pages/JobBoard";
import ProfileSetup from "@/pages/ProfileSetup";
import JobBoard from "@/pages/JobBoard";
import ProfileSetup from "@/pages/ProfileSetup";
import RedirectGoogle from "@/pages/RedirectGoogle";
import { AuthModal } from "./components/auth/AuthModal";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } },
});

function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col">
      <div className="sticky top-0 z-40 w-full max-w-7xl mx-auto px-4 pt-4">
        <Navbar />
      </div>
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/google/callback" element={<RedirectGoogle />} />
          <Route
            element={
              <ProtectedRoute>
                <AuthLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/job-board" element={<JobBoard />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <AuthModal />
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
