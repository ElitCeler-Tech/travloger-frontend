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

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavigationSection {
  title?: string
  items: NavigationItem[]
}

interface LayoutProps {
  children: React.ReactNode
}

const navigationSections: NavigationSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: HomeIcon },
      { name: 'Employees', href: '/employees', icon: UserGroupIcon }
    ]
  },
  {
    title: 'CRM',
    items: [
      { name: 'Leads', href: '/leads', icon: UserGroupIcon },
      { name: 'Bookings', href: '/bookings', icon: ClipboardDocumentListIcon },
      { name: 'Payments', href: '/payments', icon: CurrencyRupeeIcon },
      { name: 'Queries', href: '/queries', icon: DocumentTextIcon },
      { name: 'Reports', href: '/reports', icon: ChartBarIcon }
    ]
  },
  {
    title: 'Website & CMS',
    items: [
      { name: 'Website Edit', href: '/website-edit', icon: PhotoIcon },
      { name: 'Main Website Edit', href: '/main-website-edit', icon: DocumentTextIcon }
    ]
  },
  {
    title: 'Itinerary',
    items: [
      { name: 'Itinerary Builder', href: '/packages', icon: ClipboardDocumentListIcon }
    ]
  },
  {
    title: 'Admin',
    items: [
      { name: 'Settings', href: '/settings', icon: CogIcon }
    ]
  }
]

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => { logout(); navigate('/login') }
  const confirmLogout = () => { setShowLogoutModal(false); handleLogout() }

  const isPackageDetailsPage = location.pathname.match(/^\/packages\/[^\/]+$/) && !location.pathname.endsWith('/edit')
  if (location.pathname === '/login' || isPackageDetailsPage) return <>{children}</>

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col border-r border-gray-700/50 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'w-16 bg-slate-900' : 'w-56 bg-slate-900'}`}
      >
        {/* Logo */}
        <div className={`flex items-center justify-between h-14 px-3 border-b border-gray-700/50`}>
          {!sidebarCollapsed ? (
            <Link to="/" className="flex items-center">
              <Image src={logo} alt="Travloger.in" width={120} height={28} priority />
            </Link>
          ) : (
            <Link to="/" className="flex items-center justify-center w-full">
              <span className="text-white text-lg font-bold">T</span>
            </Link>
          )}
          <button
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
          </button>
          <button className="lg:hidden p-1 text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto ${sidebarCollapsed ? 'px-2 py-3' : 'px-3 py-4'}`}>
          <div className="space-y-6">
            {navigationSections.map((section, idx) => (
              <div key={idx}>
                {section.title && !sidebarCollapsed && (
                  <div className="px-3 mb-2 text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
                    {section.title}
                  </div>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.href ||
                      (item.href !== '/' && location.pathname.startsWith(item.href))

                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
                        className={`group flex items-center rounded-lg transition-all duration-200 ${
                          sidebarCollapsed
                            ? 'justify-center p-2.5'
                            : 'px-3 py-2 text-[13px] font-medium'
                        } ${
                          isActive
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                        }`}
                        title={sidebarCollapsed ? item.name : undefined}
                      >
                        {isActive && !sidebarCollapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-blue-500 rounded-r-full" />
                        )}
                        <item.icon className={`shrink-0 ${
                          sidebarCollapsed ? 'h-5 w-5' : 'h-[18px] w-[18px] mr-3'
                        } ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                        {!sidebarCollapsed && <span>{item.name}</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* User section */}
        <div className={`border-t border-gray-700/50 ${sidebarCollapsed ? 'p-2' : 'p-3'}`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className={`rounded-full flex items-center justify-center bg-blue-600 shrink-0 ${sidebarCollapsed ? 'h-8 w-8' : 'h-8 w-8'}`}>
              <span className="text-white text-xs font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-200 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{user?.role || 'User'}</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full mt-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors text-left"
            >
              Sign out
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between px-6 h-14">
            <button
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center ml-auto">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-3 py-1.5 transition-colors"
              >
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {user?.name?.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase() || 'AD'}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name || 'Admin'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Logout modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Confirm Logout</h3>
              <p className="text-sm text-gray-500 mb-6">Are you sure you want to sign out?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                <button onClick={confirmLogout} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Logout</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout
