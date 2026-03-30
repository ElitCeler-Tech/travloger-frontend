'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'employee' | 'Super Admin' | 'Agent' | 'Employer'
  user_metadata?: any
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, role: 'admin' | 'employee' | 'Super Admin' | 'Agent' | 'Employer') => Promise<void>
  logout: () => Promise<void>
  clearAuthData: () => Promise<void>
  loading: boolean
  isAuthenticated: boolean
  isFirstLogin: boolean
  checkFirstLogin: (email: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://travelogerapi.travloger.in'

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFirstLogin, setIsFirstLogin] = useState(false)

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = localStorage.getItem('access_token')
        const storedRefreshToken = localStorage.getItem('refresh_token')
        const storedUser = localStorage.getItem('user')

        if (storedToken && storedUser) {
          // Validate token with backend
          try {
            const response = await fetch(`${API_URL}/api/auth/session`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ access_token: storedToken }),
            })

            if (response.ok) {
              const data = await response.json()
              setUser(data.user)
              setToken(storedToken)
            } else {
              // Token is invalid, try to refresh
              if (storedRefreshToken) {
                await refreshSession(storedRefreshToken)
              } else {
                // Clear invalid session
                clearLocalStorage()
              }
            }
          } catch (error) {
            console.error('Error validating session:', error)
            // Try to refresh if we have a refresh token
            if (storedRefreshToken) {
              try {
                await refreshSession(storedRefreshToken)
              } catch (refreshError) {
                clearLocalStorage()
              }
            } else {
              clearLocalStorage()
            }
          }
        }
      } catch (error) {
        console.error('Error loading session:', error)
        clearLocalStorage()
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [])

  const refreshSession = async (refreshToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        const newAccessToken = data.session.access_token
        const newRefreshToken = data.session.refresh_token

        // Store new tokens
        localStorage.setItem('access_token', newAccessToken)
        localStorage.setItem('refresh_token', newRefreshToken)
        setToken(newAccessToken)

        // Get user data with new token
        const userResponse = await fetch(`${API_URL}/api/auth/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token: newAccessToken }),
        })

        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData.user)
          localStorage.setItem('user', JSON.stringify(userData.user))
        }
      } else {
        throw new Error('Failed to refresh token')
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      throw error
    }
  }

  const clearLocalStorage = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
  }

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', { email, password: '***' })

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      console.log('Login response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      const data = await response.json()
      console.log('Login successful')

      // Store session data
      localStorage.setItem('access_token', data.session.access_token)
      localStorage.setItem('refresh_token', data.session.refresh_token)
      localStorage.setItem('user', JSON.stringify(data.user))

      setUser(data.user)
      setToken(data.session.access_token)
    } catch (error: any) {
      console.error('Login error:', error)
      throw error
    }
  }

  const signup = async (name: string, email: string, password: string, role: 'admin' | 'employee' | 'Super Admin' | 'Agent' | 'Employer') => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Signup failed')
      }

      const data = await response.json()

      // Store session data
      localStorage.setItem('access_token', data.session.access_token)
      localStorage.setItem('refresh_token', data.session.refresh_token)
      localStorage.setItem('user', JSON.stringify(data.user))

      setUser(data.user)
      setToken(data.session.access_token)
    } catch (error: any) {
      console.error('Signup error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      // Clear active session for employee before logout
      if (user?.role === 'employee' || user?.role === 'Agent') {
        try {
          const employeeRes = await fetch(`${API_URL}/api/employees/by-email/${user.email}`)
          if (employeeRes.ok) {
            const employeeData = await employeeRes.json()
            if (employeeData.id) {
              // Remove the active session
              await fetch(`${API_URL}/api/employees/active-sessions`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: employeeData.id })
              })
            }
          }
        } catch (error) {
          console.error('Error clearing active session:', error)
        }
      }

      // Call backend logout endpoint
      if (token) {
        try {
          await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ access_token: token }),
          })
        } catch (error) {
          console.error('Error calling logout endpoint:', error)
        }
      }
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      clearLocalStorage()
      setIsFirstLogin(false)
    }
  }

  const clearAuthData = async () => {
    try {
      // Clear active session for employee before clearing auth data
      if (user?.role === 'employee' || user?.role === 'Agent') {
        try {
          const employeeRes = await fetch(`${API_URL}/api/employees/by-email/${user.email}`)
          if (employeeRes.ok) {
            const employeeData = await employeeRes.json()
            if (employeeData.id) {
              // Remove the active session
              await fetch(`${API_URL}/api/employees/active-sessions`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: employeeData.id })
              })
            }
          }
        } catch (error) {
          console.error('Error clearing active session:', error)
        }
      }

      // Call backend logout endpoint
      if (token) {
        try {
          await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ access_token: token }),
          })
        } catch (error) {
          console.error('Error calling logout endpoint:', error)
        }
      }
    } catch (error) {
      console.error('Error clearing auth data:', error)
    } finally {
      clearLocalStorage()
      setIsFirstLogin(false)
    }
  }

  const checkFirstLogin = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/check-first-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (response.ok) {
        setIsFirstLogin(data.isFirstLogin)
        return data.isFirstLogin
      }
      return false
    } catch (error) {
      console.error('Error checking first login:', error)
      return false
    }
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    signup,
    logout,
    clearAuthData,
    loading,
    isAuthenticated: !!user && !!token,
    isFirstLogin,
    checkFirstLogin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}



