import React from 'react'
import { Outlet, Link, NavLink } from 'react-router-dom'
import CursorGlow from '../ui/CursorGlow'

export default function App() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      <CursorGlow />
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <Link to="/" className="font-black tracking-wide text-white">ANGEL KELLOGG</Link>
          <div className="flex items-center gap-6 text-sm">
            <NavLink to="/brands" className={({isActive}) => isActive ? 'text-gold-400' : 'text-white/80 hover:text-white'}>Brands</NavLink>
            <NavLink to="/membership" className={({isActive}) => isActive ? 'text-gold-400' : 'text-white/80 hover:text-white'}>Membership</NavLink>
            <NavLink to="/contact" className={({isActive}) => isActive ? 'text-gold-400' : 'text-white/80 hover:text-white'}>Contact</NavLink>
            <NavLink to="/bio" className={({isActive}) => isActive ? 'text-gold-400' : 'text-white/80 hover:text-white'}>Bio</NavLink>
          </div>
        </div>
      </nav>
      <div className="pt-16">
        <Outlet />
      </div>
      <footer className="mt-20 border-t border-white/10 py-10 text-center text-xs text-white/60">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 space-x-4">
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <span>•</span>
            <a href="/terms" className="hover:text-white">Terms</a>
          </div>
          <p>© {new Date().getFullYear()} Angel Kellogg</p>
        </div>
      </footer>
    </div>
  )
}
