import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch,
  faUser,
  faBars,
  faXmark,
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
  { to: '/profile-setup', label: 'Profile', protected: true },
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
        className="relative w-full rounded-2xl bg-navbar-bg shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_10px_24px_-8px_rgba(0,0,0,0.35)] flex items-center justify-between px-5 py-2 min-h-15 transition-all duration-300"
        role="navigation"
        aria-label="Main Navigation"
      >
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

        <div className="relative z-10 hidden md:flex items-center justify-center gap-6 lg:gap-8 mx-auto">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={(e) => handleNavClick(e, item)}
              className="text-sm font-medium tracking-wide transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded py-1 text-white/70 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="relative z-10 hidden md:flex items-center gap-3 shrink-0 pr-1 md:pr-2">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-28 lg:w-40 h-9 rounded-lg border border-white/15 bg-white/5 px-3.5 pr-9 text-sm text-white placeholder-white/40 outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
              aria-label="Search jobs"
            />
            <button
              type="submit"
              className="absolute right-3 text-white/50 hover:text-white transition-colors"
              aria-label="Submit search"
            >
              <FontAwesomeIcon icon={faSearch} className="w-3.5 h-3.5" />
            </button>
          </form>

          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-2 pl-1.5 pr-3 h-9 rounded-lg bg-white/8 hover:bg-white/14 text-white text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                aria-label="Profile menu"
                aria-expanded={profileDropdownOpen}
              >
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center overflow-hidden shrink-0">
                  <span className="text-xs font-semibold">{user?.email?.[0]?.toUpperCase() ?? 'U'}</span>
                </div>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`text-[10px] text-white/50 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-popover rounded-xl shadow-lg ring-1 ring-foreground/10 py-2 z-50">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-xs text-muted-foreground">Signed in as</p>
                    <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleProfileNavigation}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5 text-muted-foreground" />
                    Profile Setup
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/8 transition-colors cursor-pointer"
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
              className="flex items-center gap-2 px-4 h-9 bg-white hover:bg-white/90 text-navbar-bg font-semibold text-sm rounded-lg transition-colors cursor-pointer"
            >
              <span>Log in</span>
            </button>
          )}
        </div>

        <div className="relative z-10 flex md:hidden items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-9 h-9 rounded-lg bg-white/8 text-white flex items-center justify-center hover:bg-white/14 transition-colors focus:outline-none"
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle menu"
          >
            <FontAwesomeIcon icon={isMobileMenuOpen ? faXmark : faBars} className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out absolute left-4 right-4 ${
          isMobileMenuOpen ? 'max-h-120 opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full bg-navbar-bg rounded-2xl p-4 shadow-lg flex flex-col gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 rounded-lg border border-white/15 bg-white/5 px-4 pr-10 text-sm text-white placeholder-white/40 outline-none focus:border-white/30"
              aria-label="Mobile search"
            />
            <button
              type="submit"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
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
                className="px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-white/70 hover:bg-white/8 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {isLoggedIn ? (
            <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
              <div className="px-3 pb-1 text-xs text-white/40">Signed in as {user?.email}</div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  logout()
                  navigate('/')
                }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-white/8 transition-colors cursor-pointer text-left"
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
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-white/90 text-navbar-bg font-semibold text-sm rounded-lg transition-colors cursor-pointer"
            >
              <span>Log in</span>
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
