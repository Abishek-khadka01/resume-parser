import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faBolt, faBullseye, faClipboardList } from '@fortawesome/free-solid-svg-icons'
import { Navbar } from '@/components/layout/Navbar'
import { useAuthStore } from '@/stores/authStore'

export default function Landing() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-[#fafafc] text-slate-800 overflow-x-hidden flex flex-col">
      {/* Premium Gradient Backdrops */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-radial from-purple-500/10 via-indigo-500/3 to-transparent pointer-events-none z-0" />
      
      {/* 1. Header with custom premium Navigation Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto pt-4 px-4">
        <Navbar />
      </header>

      {/* 2. Main Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-5xl mx-auto">
        {/* Decorative Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#74007a]/8 border border-[#74007a]/15 text-[#74007a] text-xs md:text-sm font-bold tracking-wide mb-8 animate-pulse">
          <FontAwesomeIcon icon={faStar} className="w-3.5 h-3.5" />
          Powered by Advanced Resume AI Matching
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-8 text-slate-900">
          Tailor Your Resume.<br />
          <span className="bg-gradient-to-r from-[#74007a] to-[#da70dc] bg-clip-text text-transparent">
            Land Your Dream Job.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
          Upload your resume and get instant matching scores (0-100%) against top job listings. Tailor your profile, track applications on our ATS Kanban board, and outsmart the algorithms.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center">
          {user ? (
            <Link
              to="/dashboard"
              className="px-8 py-4 bg-gradient-to-r from-[#74007a] to-[#da70dc] hover:from-[#da70dc] hover:to-[#74007a] text-white font-bold rounded-full shadow-[0_8px_24px_rgba(116,0,122,0.3)] transition-all duration-300 transform hover:scale-105 active:scale-98"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="px-8 py-4 bg-gradient-to-r from-[#74007a] to-[#da70dc] hover:from-[#da70dc] hover:to-[#74007a] text-white font-bold rounded-full shadow-[0_8px_24px_rgba(116,0,122,0.3)] transition-all duration-300 transform hover:scale-105 active:scale-98"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-white hover:bg-slate-50 text-[#74007a] font-bold rounded-full border border-[#74007a]/25 shadow-[0_4px_12px_rgba(116,0,122,0.06)] hover:border-[#da70dc] transition-all duration-300 transform hover:scale-105 active:scale-98"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Feature Grid Nudge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full max-w-4xl text-left">
          <div className="p-6 rounded-2xl bg-white border border-[#74007a]/10 hover:border-[#74007a]/25 shadow-[0_8px_20px_rgba(116,0,122,0.03)] hover:shadow-[0_12px_30px_rgba(116,0,122,0.08)] transition-all duration-300">
            <h3 className="text-lg font-bold text-slate-900 mb-2"><FontAwesomeIcon icon={faBolt} className="w-4 h-4 text-[#74007a] mr-1.5" />1. AI Parsing</h3>
            <p className="text-sm text-slate-500">Instantly extract skills, experience, and education from PDF/DOCX resumes.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-[#74007a]/10 hover:border-[#74007a]/25 shadow-[0_8px_20px_rgba(116,0,122,0.03)] hover:shadow-[0_12px_30px_rgba(116,0,122,0.08)] transition-all duration-300">
            <h3 className="text-lg font-bold text-slate-900 mb-2"><FontAwesomeIcon icon={faBullseye} className="w-4 h-4 text-[#74007a] mr-1.5" />2. Match Scores</h3>
            <p className="text-sm text-slate-500">See real-time compatibility scores for every job listing ranked by match %.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-[#74007a]/10 hover:border-[#74007a]/25 shadow-[0_8px_20px_rgba(116,0,122,0.03)] hover:shadow-[0_12px_30px_rgba(116,0,122,0.08)] transition-all duration-300">
            <h3 className="text-lg font-bold text-slate-900 mb-2"><FontAwesomeIcon icon={faClipboardList} className="w-4 h-4 text-[#74007a] mr-1.5" />3. Kanban ATS</h3>
            <p className="text-sm text-slate-500">Manage saved, applied, and active applications in a unified Kanban board.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-[#fafafc] py-8 text-center text-xs text-slate-400 relative z-10 mt-20">
        <p>&copy; {new Date().getFullYear()} ResumeMatch. All rights reserved.</p>
      </footer>
    </div>
  )
}
