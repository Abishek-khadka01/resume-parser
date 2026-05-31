import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faUser, faBars, faXmark, faCheck } from '@fortawesome/free-solid-svg-icons'
import logo from '../../assets/logo-white.png'
import { useAuth } from '@/hooks/useAuth'

export interface NavbarProps {
  /**
   * Optional callback when search is submitted.
   */
  onSearch?: (query: string) => void
  /**
   * Custom user auth state for demonstration or testing.
   * If provided, overrides the actual auth hook state.
   */
  demoAuthState?: 'logged_in' | 'logged_out'
}

export function Navbar({ onSearch, demoAuthState }: NavbarProps) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [demoState, setDemoState] = useState<'default' | 'logged_in' | 'logged_out'>('default')
  const navigate = useNavigate()

  // Determine current auth state based on actual hook vs demo override
  const isDemo = demoAuthState !== undefined || demoState !== 'default'
  const isLoggedIn = isDemo 
    ? (demoState === 'logged_in' || demoAuthState === 'logged_in')
    : !!user

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery)
      } else {
        navigate(`/jobs?q=${encodeURIComponent(searchQuery)}`)
      }
    }
  }

  const handleAuthClick = () => {
    if (isLoggedIn) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  const navItems = [
    { to: '/dashboard', label: 'Home' },
    { to: '/about', label: 'About Us' },
    { to: '/jobs', label: 'Jobs' },
    { to: '/ats', label: 'Resume Analyzer' },
  ]

  return (
    <div className="w-full px-4 py-4 select-none relative z-50">
      {/* Navbar Capsule Container */}
      <nav 
        className="relative w-full overflow-hidden rounded-full bg-gradient-to-r from-[#200030] via-[#480068] to-[#1a0028] shadow-[0_12px_36px_rgba(32,0,48,0.25)] border border-white/10 flex items-center justify-between px-6 py-2 min-h-[64px] transition-all duration-300"
        role="navigation"
        aria-label="Main Navigation"
      >
        {/* === Absolute Background Diagonal Panels matching the exact slashes in the mockup === */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-full hidden md:block">
          {/* Panel 1: Leftmost segment under the logo */}
          <div className="absolute left-[-10%] top-0 bottom-0 w-[28%] bg-black/15 skew-x-[25deg] border-r border-white/5 shadow-[4px_0_12px_rgba(0,0,0,0.15)]" />
          
          {/* Panel 2: Home & About Us segment */}
          <div className="absolute left-[18%] top-0 bottom-0 w-[29%] bg-white/[0.02] skew-x-[25deg] border-r border-white/5" />

          {/* Panel 3: Jobs segment */}
          <div className="absolute left-[47%] top-0 bottom-0 w-[14%] bg-black/10 skew-x-[25deg] border-r border-white/5" />
          
          {/* Panel 4: Resume Analyzer segment */}
          <div className="absolute left-[61%] top-0 bottom-0 w-[18%] bg-white/[0.01] skew-x-[25deg] border-r border-white/5" />

          {/* Panel 5: Search & Login segment */}
          <div className="absolute left-[79%] top-0 bottom-0 w-[30%] bg-black/20 skew-x-[25deg]" />
        </div>

        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* --- LEFT SECTION: LOGO --- */}
        <div className="relative z-10 flex items-center shrink-0 pl-1 md:pl-2">
          <Link 
            to="/" 
            className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-md transition-transform duration-200 hover:scale-102"
            aria-label="ResumeMatch Home"
          >
            <img 
              src={logo} 
              alt="ResumeMatch" 
              className="h-8 md:h-9 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/RM White.png'
              }}
            />
          </Link>
        </div>

        {/* --- CENTER SECTION: NAVIGATION LINKS (Desktop/Tablet) --- */}
        <div className="relative z-10 hidden md:flex items-center justify-center gap-4 lg:gap-8 xl:gap-10 mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm lg:text-base font-semibold tracking-wide transition-all duration-300 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-white py-1 ${
                  isActive
                    ? 'text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                    : 'text-white/80 hover:text-white hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-[-4px] left-[10%] right-[10%] h-[2.5px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* --- RIGHT SECTION: SEARCH & AUTH ACTIONS (Desktop/Tablet) --- */}
        <div className="relative z-10 hidden md:flex items-center gap-3 lg:gap-4 shrink-0 pr-1 md:pr-2">
          
          {/* Interactive Search Bar matching mockup style */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-28 lg:w-36 xl:w-44 h-9 rounded-full border-2 border-white bg-transparent px-4 pr-9 text-xs lg:text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300"
              aria-label="Search jobs"
            />
            <button 
              type="submit" 
              className="absolute right-3 text-white/80 hover:text-white transition-colors duration-200"
              aria-label="Submit search"
            >
              <FontAwesomeIcon icon={faSearch} className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Login / Profile Button exactly matching mockup light capsule */}
          <button
            onClick={handleAuthClick}
            className="flex items-center gap-2.5 px-6 py-1.5 bg-[#eae8f0] hover:bg-[#dfdce7] text-[#480068] font-bold text-xs lg:text-sm rounded-full shadow-md transition-all duration-300 transform hover:scale-103 active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30 h-9"
          >
            {isLoggedIn ? (
              <>
                <div className="w-5 h-5 rounded-full bg-[#480068] text-white flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                  <FontAwesomeIcon icon={faUser} className="text-[10px]" />
                </div>
                <span>Profile</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>

          {/* Demonstration/Review State Switcher (Toggles login vs profile visual styles) */}
          <button
            type="button"
            onClick={() => setDemoState(prev => prev === 'logged_in' ? 'logged_out' : 'logged_in')}
            className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/15 text-[10px] transition-all border border-white/15 cursor-pointer shrink-0"
            title="Toggle Login / Profile states for mockup preview"
            aria-label="Toggle demo state"
          >
            {isLoggedIn ? <FontAwesomeIcon icon={faCheck} className="text-[8px]" /> : 'T'}
          </button>
        </div>

        {/* --- MOBILE VIEW MENU TOGGLE --- */}
        <div className="relative z-10 flex md:hidden items-center gap-2">
          {/* Quick Demo Auth Toggle for Mobile */}
          <button
            onClick={() => setDemoState(prev => prev === 'logged_in' ? 'logged_out' : 'logged_in')}
            className="flex items-center justify-center px-2 py-1 rounded bg-white/10 text-white text-[10px] border border-white/20"
            aria-label="Toggle Demo State"
          >
            State: {isLoggedIn ? 'User' : 'Guest'}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/20 hover:bg-white/15 transition-all focus:outline-none"
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle menu"
          >
            <FontAwesomeIcon icon={isMobileMenuOpen ? faXmark : faBars} className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* --- MOBILE MENU DRAWER --- */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out absolute left-4 right-4 ${
          isMobileMenuOpen ? 'max-h-[360px] opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full bg-[#1e002c] rounded-2xl border border-white/10 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.3)] flex flex-col gap-4">
          
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 rounded-full border border-white/20 bg-white/5 px-4 pr-10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40"
              aria-label="Mobile search"
            />
            <button 
              type="submit" 
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              aria-label="Submit search"
            >
              <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
            </button>
          </form>

          {/* Mobile Navigation Links */}
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-white/10 text-white border-l-4 border-white'
                      : 'text-white/75 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile Action Button */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false)
              handleAuthClick()
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#eae8f0] hover:bg-[#dfdce7] text-[#480068] font-bold text-sm rounded-full shadow transition-all active:scale-98"
          >
            {isLoggedIn ? (
              <>
                <div className="w-5 h-5 rounded-full bg-[#480068] text-white flex items-center justify-center shadow-md">
                  <FontAwesomeIcon icon={faUser} className="text-[10px]" />
                </div>
                <span>Profile</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
