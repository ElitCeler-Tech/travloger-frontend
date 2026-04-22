'use client'

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { fetchApi } from '../../lib/api'

interface StatItem {
  name: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
  href: string
  icon: React.ReactElement
}

interface ChartDataItem {
  month: string
  queries: number
  confirmed: number
}

interface LeadStatusData {
  name: string
  value: number
  color: string
  [key: string]: any
}

const AdminDashboard: React.FC = () => {
  const [recentLeads, setRecentLeads] = useState<any[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([])
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [loadingLeads, setLoadingLeads] = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [loadingPayments, setLoadingPayments] = useState(true)

  const [dashboardStats, setDashboardStats] = useState({
    totalLeads: 0,
    activeItineraries: 0,
    totalRevenue: 0,
    totalEmployees: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)

  const [chartData, setChartData] = useState<{
    monthlyData: ChartDataItem[]
    leadStatusData: LeadStatusData[]
    recentActivity: any[]
  }>({
    monthlyData: [],
    leadStatusData: [],
    recentActivity: []
  })

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoadingStats(true)
        const [leadsData, itinerariesData, bookingsData, employeesData] = await Promise.all([
          fetchApi('/api/leads'),
          fetchApi('/api/itineraries'),
          fetchApi('/api/bookings'),
          fetchApi('/api/employees')
        ])

        const totalLeads = leadsData.leads?.length || 0
        const activeItineraries = itinerariesData.itineraries?.length || 0
        const totalRevenue =
          bookingsData.bookings?.reduce((sum: number, booking: any) => {
            if (booking.payment_status === 'Paid' || booking.paymentStatus === 'Paid') {
              return sum + (parseFloat(booking.amount) || 0)
            }
            return sum
          }, 0) || 0

        const totalEmployees = employeesData.employees?.length || 0

        setDashboardStats({
          totalLeads,
          activeItineraries,
          totalRevenue,
          totalEmployees
        })

        const monthlyData = [
          { month: 'Jan', queries: 0, confirmed: 0 },
          { month: 'Feb', queries: Math.floor(Math.random() * 8) + 1, confirmed: Math.floor(Math.random() * 3) },
          { month: 'Mar', queries: Math.floor(Math.random() * 6) + 1, confirmed: Math.floor(Math.random() * 2) },
          { month: 'Apr', queries: Math.floor(Math.random() * 4), confirmed: 0 },
          { month: 'May', queries: Math.floor(Math.random() * 3), confirmed: 0 },
          { month: 'Jun', queries: Math.floor(Math.random() * 2) + 1, confirmed: 0 },
          { month: 'Jul', queries: Math.floor(Math.random() * 3), confirmed: 0 },
          { month: 'Aug', queries: Math.floor(Math.random() * 4), confirmed: 0 },
          { month: 'Sep', queries: Math.floor(Math.random() * 2), confirmed: 0 },
          { month: 'Oct', queries: Math.floor(Math.random() * 2) + 1, confirmed: Math.floor(Math.random() * 1) },
          { month: 'Nov', queries: Math.floor(Math.random() * 3), confirmed: 0 },
          { month: 'Dec', queries: Math.floor(Math.random() * 2), confirmed: 0 }
        ]

        const leadStatusData = [
          { name: 'New', value: Math.floor(totalLeads * 0.4), color: '#8B5CF6' },
          { name: 'Follow Up', value: Math.floor(totalLeads * 0.2), color: '#10B981' },
          { name: 'Confirmed', value: Math.floor(totalLeads * 0.15), color: '#EF4444' },
          { name: 'Hot Lead', value: Math.floor(totalLeads * 0.1), color: '#F97316' },
          { name: 'Pro.con', value: Math.floor(totalLeads * 0.1), color: '#F59E0B' },
          { name: 'No Connect', value: Math.floor(totalLeads * 0.05), color: '#6B7280' }
        ]

        setChartData({
          monthlyData,
          leadStatusData,
          recentActivity: []
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchDashboardStats()
  }, [])

  useEffect(() => {
    const fetchRecentLeads = async () => {
      try {
        const data = await fetchApi('/api/leads')
        const sortedLeads = (data.leads || [])
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3)
        setRecentLeads(sortedLeads)
      } catch (error) {
        console.error('Error fetching leads:', error)
      } finally {
        setLoadingLeads(false)
      }
    }
    fetchRecentLeads()
  }, [])

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await fetchApi('/api/bookings')

        const calculateBookingStatus = (booking: any): 'Pending' | 'Completed' | 'Cancelled' => {
          const paymentStatus = booking.payment_status || booking.paymentStatus || 'Pending'
          const bookingDate = new Date(booking.booking_date || booking.bookingDate || new Date())
          const currentDate = new Date()
          const daysSinceBooking = Math.floor((currentDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24))
          const isExpired = daysSinceBooking > 30 && paymentStatus === 'Pending'

          if (paymentStatus === 'Paid') {
            return 'Completed'
          } else if (isExpired) {
            return 'Cancelled'
          } else {
            return 'Pending'
          }
        }

        const normalizedBookings = (data.bookings || []).map((booking: any) => ({
          id: booking.id,
          customer: booking.customer,
          email: booking.email,
          phone: booking.phone || '',
          package: booking.package_name || booking.package || 'N/A',
          package_name: booking.package_name || booking.package,
          destination: booking.destination,
          duration: booking.duration || 'N/A',
          travelers: booking.travelers || 1,
          amount: parseFloat(booking.amount) || 0,
          status: calculateBookingStatus(booking),
          bookingDate: booking.booking_date || booking.bookingDate || new Date().toISOString().split('T')[0],
          travelDate: booking.travel_date || booking.travelDate || '',
          paymentStatus: booking.payment_status || booking.paymentStatus || 'Pending',
          assignedAgent: booking.assigned_agent || booking.assignedAgent || 'Unassigned',
          lead_id: booking.lead_id,
          itinerary_details: booking.itinerary_details,
          razorpay_payment_link: booking.razorpay_payment_link
        }))

        setUpcomingBookings(normalizedBookings)
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setLoadingBookings(false)
      }
    }
    fetchBookings()
  }, [])

  useEffect(() => {
    const fetchRecentPayments = async () => {
      try {
        const data = await fetchApi('/api/bookings')

        const transformedPayments = (data.bookings || []).map((booking: any) => {
          const calculatePaymentStatus = () => {
            if (booking.payment_status === 'Paid') {
              return 'Paid'
            }

            const bookingDate = new Date(booking.booking_date)
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            if (bookingDate < thirtyDaysAgo) {
              return 'Cancelled'
            }

            return 'Pending'
          }

          const automaticStatus = calculatePaymentStatus()

          return {
            id: booking.id,
            bookingId: booking.id,
            booking_id: booking.id,
            customer: booking.customer,
            package: booking.package_name || booking.package || 'N/A',
            package_name: booking.package_name || booking.package,
            amount: parseFloat(booking.amount) || 0,
            paidAmount: automaticStatus === 'Paid' ? (parseFloat(booking.amount) || 0) : 0,
            paid_amount: automaticStatus === 'Paid' ? (parseFloat(booking.amount) || 0) : 0,
            remainingAmount: automaticStatus === 'Paid' ? 0 : (parseFloat(booking.amount) || 0),
            remaining_amount: automaticStatus === 'Paid' ? 0 : (parseFloat(booking.amount) || 0),
            paymentStatus: automaticStatus,
            payment_status: automaticStatus,
            paymentMethod: booking.payment_method || booking.paymentMethod || 'UPI',
            payment_method: booking.payment_method || booking.paymentMethod,
            paymentDate: booking.payment_date || (automaticStatus === 'Paid' ? booking.booking_date : null),
            payment_date: booking.payment_date,
            dueDate: booking.due_date || booking.booking_date || new Date().toISOString().split('T')[0],
            due_date: booking.due_date,
            transactionId: booking.transaction_id || null,
            transaction_id: booking.transaction_id,
            vendorPayments: [],
            email: booking.email,
            phone: booking.phone,
            destination: booking.destination,
            travelers: booking.travelers,
            travel_date: booking.travel_date
          }
        })

        const sortedPayments = transformedPayments
          .sort((a: any, b: any) => new Date(b.paymentDate || b.dueDate).getTime() - new Date(a.paymentDate || a.dueDate).getTime())
          .slice(0, 5)
        setRecentPayments(sortedPayments)
      } catch (error) {
        console.error('Error fetching payments:', error)
      } finally {
        setLoadingPayments(false)
      }
    }
    fetchRecentPayments()
  }, [])

  const stats: StatItem[] = [
    {
      name: 'Total Leads',
      value: loadingStats ? '...' : (dashboardStats.totalLeads || 0).toString(),
      change: '',
      changeType: 'increase',
      href: '/leads',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      )
    },
    {
      name: 'Active Itineraries',
      value: loadingStats ? '...' : (dashboardStats.activeItineraries || 0).toString(),
      change: '',
      changeType: 'increase',
      href: '/packages',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      name: 'Total Revenue',
      value: loadingStats ? '...' : `₹${(dashboardStats.totalRevenue || 0).toLocaleString()}`,
      change: '',
      changeType: 'increase',
      href: '/payments',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Total Employees',
      value: loadingStats ? '...' : (dashboardStats.totalEmployees || 0).toString(),
      change: '',
      changeType: 'increase',
      href: '/employees',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'} 👋</h1>
          <p className="text-sm text-gray-500">Here&apos;s what&apos;s happening with Travloger today</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/leads" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{loadingStats ? '—' : dashboardStats.totalLeads}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Leads</p>
        </Link>
        <Link to="/packages" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-purple-200 hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{loadingStats ? '—' : dashboardStats.activeItineraries}</p>
          <p className="text-xs text-gray-500 mt-0.5">Active Packages</p>
        </Link>
        <Link to="/bookings" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-green-200 hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{loadingStats ? '—' : `₹${(dashboardStats.totalRevenue / 1000).toFixed(0)}K`}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Revenue</p>
        </Link>
        <Link to="/employees" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-teal-200 hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{loadingStats ? '—' : dashboardStats.totalEmployees}</p>
          <p className="text-xs text-gray-500 mt-0.5">Employees</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">This Year — Leads vs Confirmed</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="queries" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Leads" />
                <Bar dataKey="confirmed" fill="#10b981" radius={[3, 3, 0, 0]} name="Confirmed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Leads by Status</h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData.leadStatusData} cx="50%" cy="50%" innerRadius={35} outerRadius={70} paddingAngle={4} dataKey="value">
                  {chartData.leadStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-3">
            {chartData.leadStatusData.map((item, index) => (
              <div key={index} className="flex items-center text-xs">
                <div className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: item.color }}></div>
                <span className="text-gray-600 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center p-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Recent Leads</h3>
          </div>
          <div className="p-6">
            {loadingLeads ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading...</p>
              </div>
            ) : recentLeads.length === 0 ? (
              <div className="text-center text-gray-400">
                <p>No recent leads</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLeads.slice(0, 3).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{lead.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{lead.destination || 'No destination'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{lead.status || 'New'}</p>
                      <p className="text-xs text-gray-500">
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex items-center p-6 border-b border-gray-100">
            <div className="w-1 h-6 bg-teal-500 rounded-full mr-3"></div>
            <h3 className="text-lg font-semibold text-gray-900">PAYMENT COLLECTION</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Transaction ID</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Amount</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPayments ? (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-gray-400">
                        No payment data
                      </td>
                    </tr>
                  ) : (
                    recentPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100">
                        <td className="py-2 text-sm text-gray-900">#{payment.id || payment.transactionId || 'N/A'}</td>
                        <td className="py-2 text-sm text-gray-900">₹{payment.amount || '0'}</td>
                        <td className="py-2">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${(payment.paymentStatus || payment.payment_status || '').toLowerCase() === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : (payment.paymentStatus || payment.payment_status || '').toLowerCase() === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                          >
                            {payment.paymentStatus || payment.payment_status || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default AdminDashboard

