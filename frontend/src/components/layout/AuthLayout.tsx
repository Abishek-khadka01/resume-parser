import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col">
      <div className="sticky top-0 z-40 w-full max-w-7xl mx-auto px-4 pt-4">
        <Navbar />
      </div>
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
