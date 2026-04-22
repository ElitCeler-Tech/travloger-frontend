'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import logo from '../../assets/images/logo.png'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  PhotoIcon,
  DocumentTextIcon,
  CogIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon
} from '../ui/Icons'

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { section: 'MAIN', items: [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
  ]},
  { section: 'CRM', items: [
    { name: 'Leads', href: '/leads', icon: UserGroupIcon },
    { name: 'Bookings', href: '/bookings', icon: ClipboardDocumentListIcon },
    { name: 'Payments', href: '/payments', icon: CurrencyRupeeIcon },
    { name: 'Queries', href: '/queries', icon: DocumentTextIcon },
  ]},
  { section: 'CONTENT', items: [
    { name: 'Website CMS', href: '/website-edit', icon: PhotoIcon },
    { name: 'Main Website Edit', href: '/main-website-edit', icon: DocumentTextIcon },
    { name: 'Itinerary Builder', href: '/packages', icon: ClipboardDocumentListIcon },
  ]},
  { section: 'ANALYTICS', items: [
    { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  ]},
  { section: 'MANAGE', items: [
    { name: 'Employees', href: '/employees', icon: UserGroupIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ]},
]

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const confirmLogout = () => { setShowLogoutModal(false); logout(); navigate('/login') }

  const isPackageDetailsPage = location.pathname.match(/^\/packages\/[^\/]+$/) && !location.pathname.endsWith('/edit')
  if (location.pathname === '/login' || isPackageDetailsPage) return <>{children}</>

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="fixed inset-0 bg-black/40" />
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200 bg-slate-900">
          <Link to="/" className="flex items-center gap-2">
            <Image src={logo} alt="Travloger" width={120} height={28} priority className="brightness-0 invert" />
          </Link>
          <button className="lg:hidden text-gray-300 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navItems.map((group) => (
            <div key={group.section} className="mb-5">
              <p className="px-3 mb-1.5 text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">{group.section}</p>
              {group.items.map((item) => {
                const isActive = item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors mb-0.5 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`h-[18px] w-[18px] ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-semibold">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize truncate">{user?.role || 'Admin'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full mt-3 text-left px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <button className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-600">{user?.name || 'Admin'}</span>
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center cursor-pointer" onClick={() => setShowLogoutModal(true)}>
              <span className="text-white text-xs font-semibold">{user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'AD'}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Logout modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowLogoutModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Sign out?</h3>
            <p className="text-sm text-gray-500 mb-6">You&apos;ll need to sign in again to access the panel.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={confirmLogout} className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">Sign out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout
