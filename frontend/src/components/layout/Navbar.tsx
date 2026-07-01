import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch,
  faUser,
  faBars,
  faXmark,
  faBell,
  faChevronDown,
  faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons'
import logo from '../../assets/logo-white.png'
import { useAuthStore } from '@/stores/authStore'

export interface NavbarProps {
  onSearch?: (query: string) => void
}

const navItems = [
  { to: '/', label: 'Home', protected: false },
  { to: '/dashboard', label: 'Dashboard', protected: true },
  { to: '/job-board', label: 'Job Board', protected: true },
]

export function Navbar({ onSearch }: NavbarProps) {
  const { isLoggedIn, user, logout, setAuthModalOpen } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const handleNavClick = useCallback(
    (e: React.MouseEvent, item: (typeof navItems)[number]) => {
      if (item.protected && !isLoggedIn) {
        e.preventDefault()
        setAuthModalOpen(true)
      }
    },
    [isLoggedIn, setAuthModalOpen]
  )

  const handleLoginSignup = () => {
    setAuthModalOpen(true)
  }

  const handleProfileClick = () => {
    setProfileDropdownOpen((prev) => !prev)
  }

  const handleProfileNavigation = () => {
    setProfileDropdownOpen(false)
    navigate('/profile-setup')
  }

  const handleLogout = () => {
    setProfileDropdownOpen(false)
    logout()
    navigate('/')
  }

  return (
    <div className="w-full px-4 py-4 select-none relative z-50">
      <nav
        className="relative w-full rounded-full bg-gradient-to-r from-[#200030] via-[#480068] to-[#1a0028] shadow-[0_12px_36px_rgba(32,0,48,0.25)] border border-white/10 flex items-center justify-between px-6 py-2 min-h-[64px] transition-all duration-300"
        role="navigation"
        aria-label="Main Navigation"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-full hidden md:block">
          <div className="absolute left-[-10%] top-0 bottom-0 w-[28%] bg-black/15 skew-x-[25deg] border-r border-white/5 shadow-[4px_0_12px_rgba(0,0,0,0.15)]" />
          <div className="absolute left-[18%] top-0 bottom-0 w-[29%] bg-white/[0.02] skew-x-[25deg] border-r border-white/5" />
          <div className="absolute left-[47%] top-0 bottom-0 w-[14%] bg-black/10 skew-x-[25deg] border-r border-white/5" />
          <div className="absolute left-[61%] top-0 bottom-0 w-[18%] bg-white/[0.01] skew-x-[25deg] border-r border-white/5" />
          <div className="absolute left-[79%] top-0 bottom-0 w-[30%] bg-black/20 skew-x-[25deg]" />
        </div>

        <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

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

        <div className="relative z-10 hidden md:flex items-center justify-center gap-4 lg:gap-8 xl:gap-10 mx-auto">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={(e) => handleNavClick(e, item)}
              className="text-sm lg:text-base font-semibold tracking-wide transition-all duration-300 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-white py-1 text-white/80 hover:text-white hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]"
            >
              {item.label}
            </Link>
          ))}

          <Link
            to="/dashboard"
            className="text-sm lg:text-base font-semibold tracking-wide transition-all duration-300 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-white py-1 text-white/80 hover:text-white hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]"
            aria-label="Notifications"
          >
            <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
          </Link>
        </div>

        <div className="relative z-10 hidden md:flex items-center gap-3 lg:gap-4 shrink-0 pr-1 md:pr-2">
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

          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-2 px-4 py-1.5 bg-[#eae8f0] hover:bg-[#dfdce7] text-[#480068] font-bold text-xs lg:text-sm rounded-full shadow-md transition-all duration-300 transform hover:scale-103 active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30 h-9"
                aria-label="Profile menu"
                aria-expanded={profileDropdownOpen}
              >
                <div className="w-5 h-5 rounded-full bg-[#480068] text-white flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                  <FontAwesomeIcon icon={faUser} className="text-[10px]" />
                </div>
                <span className="max-w-[80px] truncate">{user?.email?.[0]?.toUpperCase() ?? 'U'}</span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`text-[10px] transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-500">Signed in as</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleProfileNavigation}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5 text-slate-400" />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="w-3.5 h-3.5" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleLoginSignup}
              className="flex items-center gap-2 px-6 py-1.5 bg-[#eae8f0] hover:bg-[#dfdce7] text-[#480068] font-bold text-xs lg:text-sm rounded-full shadow-md transition-all duration-300 transform hover:scale-103 active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30 h-9"
            >
              <FontAwesomeIcon icon={faUser} className="w-3 h-3" />
              <span>Login / Sign Up</span>
            </button>
          )}
        </div>

        <div className="relative z-10 flex md:hidden items-center gap-2">
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

      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out absolute left-4 right-4 ${
          isMobileMenuOpen ? 'max-h-[480px] opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full bg-[#1e002c] rounded-2xl border border-white/10 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.3)] flex flex-col gap-4">
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

          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={(e) => {
                  handleNavClick(e, item)
                  if (!item.protected || isLoggedIn) {
                    setIsMobileMenuOpen(false)
                  }
                }}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-all text-white/75 hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {isLoggedIn ? (
            <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
              <div className="px-2 text-xs text-white/50">Signed in as {user?.email}</div>
              <Link
                to="/profile-setup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white/75 hover:bg-white/5 hover:text-white transition-all"
              >
                <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                Profile
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  logout()
                  navigate('/')
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-300 hover:bg-white/5 hover:text-red-200 transition-all cursor-pointer"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
                Log out
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false)
                handleLoginSignup()
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#eae8f0] hover:bg-[#dfdce7] text-[#480068] font-bold text-sm rounded-full shadow transition-all active:scale-98 cursor-pointer"
            >
              <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5" />
              <span>Login / Sign Up</span>
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
