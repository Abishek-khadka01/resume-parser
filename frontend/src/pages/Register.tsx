import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { AuthIllustration } from '@/components/auth/AuthIllustration'
import logo from '@/assets/logo-purple.png'
import api from '@/lib/api'

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
})
type FormData = z.infer<typeof schema>

const NAV_ITEMS = [
  { to: '/', label: 'HOME' },
  { to: '/about', label: 'ABOUT US' },
  { to: '/contact', label: 'CONTACT' },
  { to: '/register', label: 'SIGN UP' },
]

export default function Register() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/auth/register', { email: data.email, password: data.password })
      toast.success('Account created — please sign in')
      navigate('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? 'Registration failed')
    }
  }

  const handleGoogleSignup = () => {
    toast.info('Google authentication requires backend integration. See walkthrough for API requirements.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0e6f6] via-[#ece0f0] to-[#e8daf0] p-4 md:p-8">
      {/* Outer decorative diagonal lines */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[200%] border border-[#d4b8e0]/30 -rotate-[25deg]" />
        <div className="absolute top-[-10%] left-[5%] w-[60%] h-[200%] border border-[#d4b8e0]/20 -rotate-[25deg]" />
        <div className="absolute top-[-10%] right-[-15%] w-[60%] h-[200%] border border-[#d4b8e0]/25 -rotate-[25deg]" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-5xl bg-white rounded-3xl shadow-[0_20px_60px_rgba(116,0,122,0.12)] flex flex-col md:flex-row overflow-hidden min-h-[560px]">

        {/* ===== LEFT SIDE: Form ===== */}
        <div className="flex-1 flex flex-col px-8 md:px-12 py-8 md:py-10">

          {/* Top Navigation */}
          <nav className="flex items-center gap-6 mb-10" aria-label="Auth navigation">
            <Link to="/" className="shrink-0 mr-4">
              <img src={logo} alt="ResumeMatch" className="h-10 w-auto" />
            </Link>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-xs md:text-sm font-bold tracking-wider transition-colors ${
                    isActive
                      ? 'text-[#74007a] border-b-2 border-[#74007a] pb-0.5'
                      : 'text-slate-500 hover:text-[#74007a]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-[#3a0040] mb-8 italic" style={{ fontFamily: 'Georgia, serif' }}>
            Sign up
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-md">

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                Full Name
              </label>
              <div className="flex items-center px-4 py-3 rounded-full border border-slate-300 bg-white focus-within:border-[#74007a] focus-within:ring-1 focus-within:ring-[#74007a]/20 transition-all">
                <input
                  id="fullName"
                  type="text"
                  placeholder="Daniel Gallego"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                  {...register('fullName')}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-red-500 mt-1 ml-4">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                Email Address
              </label>
              <div className="flex items-center px-4 py-3 rounded-full border border-slate-200 bg-slate-50 focus-within:border-[#74007a] focus-within:ring-1 focus-within:ring-[#74007a]/20 transition-all">
                <input
                  id="email"
                  type="email"
                  placeholder="hello@reallygreatsite.com"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1 ml-4">{errors.email.message}</p>
              )}
            </div>

            {/* Password & Confirm Password Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label htmlFor="password" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                  Password
                </label>
                <div className="flex items-center px-4 py-3 rounded-full border border-slate-200 bg-slate-50 focus-within:border-[#74007a] focus-within:ring-1 focus-within:ring-[#74007a]/20 transition-all">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none min-w-0"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-[#74007a] transition-colors ml-2 shrink-0"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1 ml-4">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                  Confirm Password
                </label>
                <div className="flex items-center px-4 py-3 rounded-full border border-slate-200 bg-slate-50 focus-within:border-[#74007a] focus-within:ring-1 focus-within:ring-[#74007a]/20 transition-all">
                  <input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none min-w-0"
                    {...register('confirm')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-slate-400 hover:text-[#74007a] transition-colors ml-2 shrink-0"
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} className="text-sm" />
                  </button>
                </div>
                {errors.confirm && (
                  <p className="text-xs text-red-500 mt-1 ml-4">{errors.confirm.message}</p>
                )}
              </div>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-full bg-[#4a0080] hover:bg-[#5c00a0] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#4a0080]/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Google Sign Up */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full py-3 rounded-full border-2 border-[#74007a]/40 bg-white hover:bg-[#faf5fc] text-[#74007a] font-bold text-sm tracking-wide flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Log in With GOOGLE
            </button>

            {/* Login Link */}
            <p className="text-sm text-slate-500">
              or{' '}
              <Link
                to="/login"
                className="text-[#74007a] font-semibold underline underline-offset-4 hover:text-[#da70dc] transition-colors"
              >
                Log in
              </Link>
            </p>
          </form>
        </div>

        {/* ===== RIGHT SIDE: Illustration ===== */}
        <div className="hidden md:block w-[45%] lg:w-[42%]">
          <AuthIllustration />
        </div>
      </div>
    </div>
  )
}
