'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import logo from '../../assets/images/logo.png'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
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
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()


  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)
    handleLogout()
  }

  const isPackageDetailsPage = location.pathname.match(/^\/packages\/[^\/]+$/) && !location.pathname.endsWith('/edit')

  if (location.pathname === '/login' || isPackageDetailsPage) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'w-12 bg-slate-800' : 'w-48 bg-slate-800 shadow-xl'}`}
      >
        <div
          className={`flex items-center justify-between h-10 px-1 py-1 border-b ${
            sidebarCollapsed ? 'bg-slate-800 border-gray-600' : 'bg-slate-800 border-gray-600'
          }`}
        >
          {!sidebarCollapsed && (
            <Link to="/" className="inline-flex items-center px-1 py-1">
              <Image src={logo} alt="Travloger.in" width={100} height={20} priority />
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="flex items-center justify-center w-full">
              <span className="text-gray-200 text-[6px] font-medium">T</span>
            </div>
          )}
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-1'}`}>
            <button
              className={`hidden lg:block p-0.5 rounded-md transition-colors ${
                sidebarCollapsed
                  ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700'
                  : 'text-gray-300 hover:text-gray-100 hover:bg-gray-700'
              }`}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="h-2.5 w-2.5" />
              ) : (
                <ChevronLeftIcon className="h-2.5 w-2.5" />
              )}
            </button>
            <button
              className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </div>
        </div>

        <nav className={`flex-1 flex flex-col ${sidebarCollapsed ? 'px-0.5 py-1' : 'px-2 py-2'}`}>
          <div className="flex flex-col justify-evenly flex-1 space-y-1">
            {navigationSections.map((section, idx) => (
              <React.Fragment key={idx}>
                {section.title && !sidebarCollapsed && (
                  <div className="px-2 pb-1 pt-2 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => {
                  const isActive = location.pathname === item.href
                  const isSettingsItem = item.name === 'Settings'

                  return (
                    <div key={item.name}>
                      <Link
                        to={item.href}
                        onClick={() => {
                          if (window.innerWidth < 1024) {
                            setSidebarOpen(false)
                          }
                        }}
                        className={`group flex items-center transition-all duration-200 relative ${
                          sidebarCollapsed
                            ? 'justify-center p-1.5' + (isActive ? ' bg-gray-300 rounded-sm' : '')
                            : 'px-2 py-1.5 text-xs font-medium rounded-md' +
                              (isActive
                                ? ' bg-gray-300 text-gray-800'
                                : ' text-gray-300 hover:bg-gray-700 hover:text-gray-100')
                        }`}
                        title={sidebarCollapsed ? item.name : undefined}
                      >
                        {isActive && !sidebarCollapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-600 rounded-r-full"></div>
                        )}

                        <item.icon
                          className={`shrink-0 ${
                            sidebarCollapsed
                              ? 'h-5 w-5' + (isActive ? ' text-gray-700' : ' text-gray-300')
                              : 'h-4 w-4 mr-2' +
                                (isActive ? ' text-gray-800' : ' text-gray-300 group-hover:text-gray-100')
                          }`}
                        />
                        {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                      </Link>
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </nav>

        <div
          className={`shrink-0 border-t ${
            sidebarCollapsed ? 'p-0.5 border-gray-600' : 'p-1 border-gray-600'
          }`}
        >
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-1'}`}>
            <div
              className={`rounded-full flex items-center justify-center ${
                sidebarCollapsed ? 'h-5 w-5 bg-gray-600' : 'h-5 w-5 bg-primary'
              }`}
            >
              <span
                className={`text-white font-medium ${
                  sidebarCollapsed ? 'text-[10px]' : 'text-[10px]'
                }`}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium text-gray-200 truncate">{user?.name || 'User'}</p>
                <p className="text-[8px] text-gray-400 truncate capitalize">{user?.role || 'User'}</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full mt-1 px-1 py-0.5 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
            >
              Sign out
            </button>
          )}
        </div>
      </div>

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out`}
      >
        <header className="bg-white shadow-sm border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between px-6 py-3">
            <button
              className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600"
              onClick={() => setSidebarOpen(true)}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-end w-full gap-1">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center hover:bg-gray-50 rounded-md p-1 transition-colors"
                title="Click to logout"
              >
                <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-gray-700 text-[10px] font-semibold">
                    {user?.name?.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase() || 'AD'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-2">
          <div className="w-full h-full">{children}</div>
        </main>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />

          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Logout</h3>

              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to logout? You will need to sign in again to access the admin panel.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout



