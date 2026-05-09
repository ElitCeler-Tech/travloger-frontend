import React, { useState, useEffect, useCallback } from 'react'
import { Users, BarChart3, UserCheck, UserX, CalendarDays, Search, Share2, ChevronDown, ChevronUp, MapPin, Phone, Mail, Clock, MousePointerClick, Eye, TrendingUp, IndianRupee, Package, Globe, Target, ArrowRightLeft, MessageCircle } from 'lucide-react'
import { fetchApi, handleApiError } from '../../../lib/api'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  source: string
  destination: string
  number_of_travelers: string
  travel_dates: string
  custom_notes: string
  created_at: string
  assigned_employee_id?: string
  assigned_employee_name?: string
  assigned_employee_email?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  lead_source_id?: number
  lead_score?: number
  lead_priority?: string
  last_score_calculated?: string
}

interface TrackingJourney {
  id: string
  name: string
  email: string
  phone: string
  destination: string
  source: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  lead_score: number
  lead_priority: string
  assigned_employee_name: string | null
  created_at: string
  engagement: { total_time: number; max_scroll: number; cta_clicks: number; pages_viewed: number; device: string | null; events_count: number }
  bookings: { id: string; package_name: string; destination: string; amount: number; travelers: number; status: string; payment_status: string; travel_date: string; created_at: string }[]
  total_revenue: number
  total_bookings: number
  confirmed_bookings: number
}

interface TrackingStats {
  total_revenue: number
  total_bookings: number
  avg_booking_value: number
  top_destination: string
  top_source: string
  top_package: string
  conversion_rate: number
  avg_lead_score: number
  total_leads: number
}

type FilterType = string

const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'leads' | 'tracking'>('leads')
  const [trackingData, setTrackingData] = useState<{ stats: TrackingStats; journeys: TrackingJourney[] } | null>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [trackingSearch, setTrackingSearch] = useState('')

  const [showModal, setShowModal] = useState<boolean>(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [dateFilter, setDateFilter] = useState<string>('all') // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [customDateFrom, setCustomDateFrom] = useState<string>('')
  const [customDateTo, setCustomDateTo] = useState<string>('')
  const [destinations, setDestinations] = useState<string[]>([])
  const [loadingDestinations, setLoadingDestinations] = useState<boolean>(false)

  // Fetch destinations
  const fetchDestinations = useCallback(async () => {
    try {
      setLoadingDestinations(true)
      const validDestinations = ['Ladakh', 'Kashmir', 'Kerala', 'Gokarna', 'Meghalaya', 'Manali', 'Singapore', 'Hyderabad', 'Bengaluru', 'Mysore']
      setDestinations(validDestinations)
    } catch (error) {
      console.error('Error fetching destinations:', error)
    } finally {
      setLoadingDestinations(false)
    }
  }, [])

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false)
  const [assigningLead, setAssigningLead] = useState<Lead | null>(null)
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [assigning, setAssigning] = useState<boolean>(false)

  // Create lead modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    number_of_travelers: '',
    travel_dates: '',
    source: 'Meta Ads',
    custom_source: '',
    destination: 'Kashmir',
    custom_notes: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: ''
  })
  const [isCreating, setIsCreating] = useState<boolean>(false)

  // Fetch leads from API
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true)
        const data = await fetchApi('/api/leads')
        setLeads(data.leads || [])
        setError(null)
      } catch (err) {
        const message = handleApiError(err)
        setError(message || 'Failed to fetch leads')
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
    fetchDestinations()
  }, [fetchDestinations])

  // Fetch tracking data when switching to tracking view
  const fetchTracking = useCallback(async () => {
    try {
      setTrackingLoading(true)
      const data = await fetchApi('/api/leads/tracking')
      setTrackingData(data)
    } catch (err) {
      console.error('Failed to fetch tracking:', err)
    } finally {
      setTrackingLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeView === 'tracking' && !trackingData) fetchTracking()
  }, [activeView, trackingData, fetchTracking])

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const fmtTime = (secs: number) => {
    if (secs <= 0) return '0s'
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = Math.round(secs % 60)
    if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
    if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`
    return `${s}s`
  }

  const fmtCurrency = (n: number) => '₹' + n.toLocaleString('en-IN')

  const priorityStyle = (p: string) =>
    p === 'Hot' ? 'bg-red-100 text-red-700' : p === 'Warm' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'

  const statusStyle = (s: string) =>
    s === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : s === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'

  const paymentStyle = (s: string) =>
    s === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'

  // Filter leads based on month, year, and date
  const getFilteredLeads = (): Lead[] => {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    return leads.filter(lead => {
      const leadDate = new Date(lead.created_at)
      const leadDateStr = `${leadDate.getFullYear()}-${String(leadDate.getMonth() + 1).padStart(2, '0')}-${String(leadDate.getDate()).padStart(2, '0')}`
      if (dateFilter === 'today') return leadDateStr === today
      if (dateFilter === 'week') return leadDate >= weekAgo
      if (dateFilter === 'month') return leadDate >= monthStart
      if (dateFilter === 'custom') {
        if (customDateFrom && customDateTo) return leadDateStr >= customDateFrom && leadDateStr <= customDateTo
        if (customDateFrom) return leadDateStr >= customDateFrom
        if (customDateTo) return leadDateStr <= customDateTo
      }
      return true
    })
  }

  const filteredLeads = getFilteredLeads().filter(lead => {
    if (filter === 'all') return true
    return lead.destination === filter
  })

  const getSourceColor = (source: string): string => {
    return 'bg-slate-100 text-slate-800'
  }

  const getDestinationColor = (destination: string): string => {
    return 'bg-slate-100 text-slate-800'
  }

  const openLeadDetails = (lead: Lead): void => {
    setSelectedLead(lead)
    setShowModal(true)
  }

  const handleDeleteLead = async (leadId: string): Promise<void> => {
    try {
      setDeleting(true)
      await fetchApi('/api/leads', {
        method: 'DELETE',
        body: JSON.stringify({ id: leadId })
      })

      setLeads(leads.filter(lead => lead.id !== leadId))
      setShowDeleteModal(false)
      setLeadToDelete(null)
      alert('Lead record deleted successfully')
    } catch (error) {
      const message = handleApiError(error)
      alert('Failed to delete lead: ' + message)
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteModal = (lead: Lead): void => {
    setLeadToDelete(lead)
    setShowDeleteModal(true)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openAssignModal = async (lead: Lead) => {
    setAssigningLead(lead)
    setShowAssignModal(true)
    setSearchTerm('')
    setLoadingEmployees(true)
    try {
      const data = await fetchApi(`/api/employees?destination=${encodeURIComponent(lead.destination)}`)
      setEmployees((data.employees || []).map((e: any) => ({ id: String(e.id), name: e.name, email: e.email })))
    } catch (error) {
      console.error('Error fetching employees:', error)
      setEmployees([])
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleAssignLead = async (employeeId: string, employeeName: string, employeeEmail: string) => {
    if (!assigningLead) return

    setAssigning(true)
    try {
      await fetchApi('/api/leads/assign', {
        method: 'POST',
        body: JSON.stringify({
          leadId: assigningLead.id,
          employeeId,
          employeeName,
          employeeEmail
        })
      })

      setLeads(prev =>
        prev.map(lead =>
          lead.id === assigningLead.id
            ? {
                ...lead,
                assigned_employee_id: employeeId,
                assigned_employee_name: employeeName,
                assigned_employee_email: employeeEmail
              }
            : lead
        )
      )

      setAssigningLead(prev =>
        prev
          ? {
              ...prev,
              assigned_employee_id: employeeId,
              assigned_employee_name: employeeName,
              assigned_employee_email: employeeEmail
            }
          : null
      )

      alert(
        `Successfully assigned lead to ${employeeName}. Emails have been sent to both the customer (${assigningLead.email}) and the employee (${employeeEmail}) with relevant details.`
      )
    } catch (error) {
      const message = handleApiError(error)
      alert(message || 'Failed to assign lead')
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassignLead = async () => {
    if (!assigningLead) return

    try {
      await fetchApi('/api/leads/unassign', {
        method: 'POST',
        body: JSON.stringify({
          leadId: assigningLead.id
        })
      })

      setLeads(prev =>
        prev.map(lead =>
          lead.id === assigningLead.id
            ? {
                ...lead,
                assigned_employee_id: undefined,
                assigned_employee_name: undefined,
                assigned_employee_email: undefined
              }
            : lead
        )
      )

      setAssigningLead(prev =>
        prev
          ? {
              ...prev,
              assigned_employee_id: undefined,
              assigned_employee_name: undefined,
              assigned_employee_email: undefined
            }
          : null
      )

      alert('Lead unassigned successfully')
    } catch (error) {
      const message = handleApiError(error)
      alert(message || 'Failed to unassign lead')
    }
  }

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateLead = async () => {
    if (!newLead.name || !newLead.email || !newLead.phone) {
      alert('Please fill in all required fields (Name, Email, Contact Number)')
      return
    }

    if (newLead.phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number')
      return
    }

    setIsCreating(true)
    try {
      const leadData = {
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone,
        number_of_travelers: newLead.number_of_travelers,
        travel_dates: newLead.travel_dates,
        source: newLead.source === 'Custom' ? newLead.custom_source : newLead.source,
        destination: newLead.destination,
        custom_notes: newLead.custom_notes,
        utm_source: newLead.utm_source,
        utm_medium: newLead.utm_medium,
        utm_campaign: newLead.utm_campaign
      }

      const response = await fetchApi('/api/leads', {
        method: 'POST',
        body: JSON.stringify(leadData)
      })

      if (response?.lead) {
        setLeads(prev => [response.lead, ...prev])
      }

      setShowCreateModal(false)
      setNewLead({
        name: '',
        email: '',
        phone: '',
        number_of_travelers: '',
        travel_dates: '',
        source: 'Meta Ads',
        custom_source: '',
        destination: 'Kashmir',
        custom_notes: '',
        utm_source: '',
        utm_medium: '',
        utm_campaign: ''
      })
      alert('Lead created successfully!')
    } catch (error) {
      const message = handleApiError(error)
      alert(message || 'Failed to create lead')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500">Manage and track customer inquiries</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            <button onClick={() => setActiveView('leads')} className={`px-4 py-1.5 font-medium transition-colors ${activeView === 'leads' ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Leads
            </button>
            <button onClick={() => setActiveView('tracking')} className={`px-4 py-1.5 font-medium transition-colors ${activeView === 'tracking' ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              User Tracking
            </button>
          </div>
          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <div className="flex rounded-md border border-gray-300 overflow-hidden text-sm">
              {(['all','today','week','month','custom'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setDateFilter(opt)}
                  className={`px-3 py-1.5 transition-colors ${dateFilter === opt ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {opt === 'all' ? 'All' : opt === 'today' ? 'Today' : opt === 'week' ? 'This Week' : opt === 'month' ? 'This Month' : 'Custom'}
                </button>
              ))}
            </div>
            {dateFilter === 'custom' && (
              <div className="flex items-center space-x-1">
                <input type="date" value={customDateFrom} onChange={e => setCustomDateFrom(e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="text-gray-500 text-sm">to</span>
                <input type="date" value={customDateTo} onChange={e => setCustomDateTo(e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            {getFilteredLeads().filter(lead => {
              const leadDate = new Date(lead.created_at)
              const thirtyDaysAgo = new Date()
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
              return leadDate < thirtyDaysAgo
            }).length > 0 && (
              <button 
                onClick={() => {
                  const oldLeads = getFilteredLeads().filter(lead => {
                    const leadDate = new Date(lead.created_at)
                    const thirtyDaysAgo = new Date()
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                    return leadDate < thirtyDaysAgo
                  })
                  if (confirm(`Delete ${oldLeads.length} leads older than 30 days? This action cannot be undone.`)) {
                    // Bulk delete old leads
                    oldLeads.forEach(lead => {
                      handleDeleteLead(lead.id)
                    })
                  }
                }}
                className="bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors text-sm"
              >
                Clean Old ({getFilteredLeads().filter(lead => {
                  const leadDate = new Date(lead.created_at)
                  const thirtyDaysAgo = new Date()
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                  return leadDate < thirtyDaysAgo
                }).length})
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create New Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {activeView === 'leads' && (() => {
        const filtered = getFilteredLeads()
        const periodLabel = dateFilter === 'all' ? 'All time' : dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This week' : dateFilter === 'month' ? 'This month' : 'Selected period'
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: 'Total Leads', value: leads.length, icon: <Users size={18} />, sub: 'All time' },
              { label: 'This Period', value: filtered.length, icon: <BarChart3 size={18} />, sub: periodLabel },
              { label: 'Assigned', value: filtered.filter(l => l.assigned_employee_id).length, icon: <UserCheck size={18} />, sub: periodLabel },
              { label: 'Unassigned', value: filtered.filter(l => !l.assigned_employee_id).length, icon: <UserX size={18} />, sub: periodLabel },
              { label: 'This Year', value: leads.filter(l => new Date(l.created_at).getFullYear() === new Date().getFullYear()).length, icon: <CalendarDays size={18} />, sub: new Date().getFullYear().toString() },
              { label: 'Google Ads', value: filtered.filter(l => l.source === 'Google Ads' || l.utm_source?.toLowerCase().includes('google')).length, icon: <Search size={18} />, sub: periodLabel },
              { label: 'Meta Ads', value: filtered.filter(l => l.source === 'Meta Ads' || l.utm_source?.toLowerCase().includes('meta') || l.utm_source?.toLowerCase().includes('facebook')).length, icon: <Share2 size={18} />, sub: periodLabel },
              { label: 'WhatsApp', value: filtered.filter(l => l.source === 'WhatsApp').length, icon: <MessageCircle size={18} />, sub: periodLabel },
            ].map(stat => (
              <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">{stat.label}</span>
                  <span className="text-gray-400">{stat.icon}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-[11px] text-gray-400">{stat.sub}</div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Filters */}
      {activeView === 'leads' && <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === 'all' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({leads.length})
          </button>
          {loadingDestinations ? (
            <div className="flex items-center space-x-2 px-3 py-1">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-gray-500">Loading filters...</span>
            </div>
          ) : (
            destinations.map((destination, index) => {
              const count = leads.filter(l => l.destination === destination).length;
              return (
                <button
                  key={`${destination}-${index}`}
                  onClick={() => setFilter(destination)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === destination ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {String(destination)} ({count})
                </button>
              );
            })
          )}
        </div>
      </div>}

      {/* Leads Table */}
      {activeView === 'leads' && <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-4 text-center">
            <div className="text-sm text-gray-500">Loading leads...</div>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <div className="text-sm text-red-500">{error}</div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-4 text-center">
            <div className="text-sm text-gray-500">No leads found</div>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Travelers</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Travel Dates</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">{lead.name || 'N/A'}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">{lead.email || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{lead.phone || 'N/A'}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getSourceColor(lead.source)}`}>
                        {lead.source}
                      </span>
                      {(lead as any).whatsapp_clicked && <span className="ml-1 inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">WA</span>}
                      {(lead as any).call_clicked && <span className="ml-1 inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700">Call</span>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {lead.lead_priority ? (
                        <div className="flex items-center gap-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                            lead.lead_priority === 'Hot' ? 'bg-red-100 text-red-800' :
                            lead.lead_priority === 'Warm' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {lead.lead_priority}
                          </span>
                          <span className="text-xs text-gray-500">({lead.lead_score || 0})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Not scored</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {lead.number_of_travelers || 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {lead.travel_dates ? lead.travel_dates.split('-').reverse().join('/') : 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getDestinationColor(lead.destination)}`}>
                        {lead.destination || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {lead.assigned_employee_id ? (
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs font-medium">
                            Assigned
                          </span>
                          <button
                            onClick={() => openAssignModal(lead)}
                            className="text-slate-800 hover:opacity-80 text-xs"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openAssignModal(lead)}
                          className="px-2 py-1 rounded bg-slate-800 text-white hover:bg-slate-700 text-xs"
                        >
                          Assign To
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <button
                        onClick={() => openLeadDetails(lead)}
                        className="text-slate-800 hover:opacity-80 mr-3"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => openDeleteModal(lead)}
                        className="text-red-500 hover:text-red-600 text-xs"
                        title="Delete Lead Record"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>}

      {/* User Tracking View */}
      {activeView === 'tracking' && (
        trackingLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
            <span className="ml-3 text-sm text-gray-500">Loading user tracking data...</span>
          </div>
        ) : trackingData ? (
          <div className="space-y-4">
            {/* Tracking Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: 'Total Revenue', value: fmtCurrency(trackingData.stats.total_revenue), icon: <IndianRupee size={18} />, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', iconColor: 'text-emerald-500' },
                { label: 'Total Bookings', value: trackingData.stats.total_bookings, icon: <Package size={18} />, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconColor: 'text-blue-500' },
                { label: 'Avg Booking Value', value: fmtCurrency(trackingData.stats.avg_booking_value), icon: <TrendingUp size={18} />, bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', iconColor: 'text-purple-500' },
                { label: 'Conversion Rate', value: trackingData.stats.conversion_rate + '%', icon: <ArrowRightLeft size={18} />, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconColor: 'text-amber-500' },
                { label: 'Avg Lead Score', value: trackingData.stats.avg_lead_score, icon: <Target size={18} />, bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', iconColor: 'text-sky-500' },
              ].map(stat => (
                <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-xl p-4 flex flex-col gap-1.5`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">{stat.label}</span>
                    <span className={stat.iconColor}>{stat.icon}</span>
                  </div>
                  <div className={`text-2xl font-bold ${stat.text}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Top Insights Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center"><MapPin size={16} className="text-indigo-500" /></div>
                <div><div className="text-[11px] text-gray-400 uppercase tracking-wide">Top Destination</div><div className="text-sm font-semibold text-gray-800">{trackingData.stats.top_destination}</div></div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center"><Globe size={16} className="text-pink-500" /></div>
                <div><div className="text-[11px] text-gray-400 uppercase tracking-wide">Top Source</div><div className="text-sm font-semibold text-gray-800">{trackingData.stats.top_source}</div></div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center"><Package size={16} className="text-teal-500" /></div>
                <div><div className="text-[11px] text-gray-400 uppercase tracking-wide">Top Package</div><div className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{trackingData.stats.top_package}</div></div>
              </div>
            </div>

            {/* Search + Count */}
            <div className="flex items-center justify-between">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, destination..."
                  value={trackingSearch}
                  onChange={e => setTrackingSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <span className="text-sm text-gray-500">{trackingData.journeys.length} leads tracked</span>
            </div>

            {/* Journey Cards */}
            <div className="space-y-2">
              {trackingData.journeys
                .filter(j => {
                  if (!trackingSearch) return true
                  const q = trackingSearch.toLowerCase()
                  return (j.name || '').toLowerCase().includes(q) || (j.email || '').toLowerCase().includes(q) || (j.phone || '').includes(q) || (j.destination || '').toLowerCase().includes(q)
                })
                .map(journey => {
                  const isExpanded = expandedCards.has(journey.id)
                  return (
                    <div key={journey.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-shadow hover:shadow-sm">
                      {/* Card Header */}
                      <button onClick={() => toggleCard(journey.id)} className="w-full px-5 py-3.5 flex items-center gap-4 text-left">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                          {(journey.name || '?')[0].toUpperCase()}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900 truncate">{journey.name || 'Unknown'}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityStyle(journey.lead_priority)}`}>{journey.lead_priority}</span>
                            {journey.lead_score > 0 && <span className="text-[10px] text-gray-400">Score: {journey.lead_score}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                            {journey.destination && <span className="flex items-center gap-1"><MapPin size={11} />{journey.destination}</span>}
                            {journey.source && <span className="flex items-center gap-1"><Globe size={11} />{journey.source}</span>}
                            <span>{new Date(journey.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>
                        {/* Quick Stats */}
                        <div className="flex items-center gap-5 shrink-0">
                          {journey.total_bookings > 0 && (
                            <div className="text-right">
                              <div className="text-xs text-gray-400">Revenue</div>
                              <div className="text-sm font-semibold text-emerald-600">{fmtCurrency(journey.total_revenue)}</div>
                            </div>
                          )}
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Bookings</div>
                            <div className="text-sm font-semibold text-gray-700">{journey.total_bookings}</div>
                          </div>
                          {journey.engagement.events_count > 0 && (
                            <div className="text-right">
                              <div className="text-xs text-gray-400">Engagement</div>
                              <div className="text-sm font-semibold text-blue-600">{fmtTime(journey.engagement.total_time)}</div>
                            </div>
                          )}
                          {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                          {/* Contact + Source Row */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</h4>
                              <div className="space-y-1.5 text-sm">
                                {journey.email && <div className="flex items-center gap-2 text-gray-600"><Mail size={13} className="text-gray-400" />{journey.email}</div>}
                                {journey.phone && <div className="flex items-center gap-2 text-gray-600"><Phone size={13} className="text-gray-400" />{journey.phone}</div>}
                                {journey.assigned_employee_name && <div className="flex items-center gap-2 text-gray-600"><UserCheck size={13} className="text-gray-400" />Assigned: {journey.assigned_employee_name}</div>}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Source Attribution</h4>
                              <div className="space-y-1.5 text-sm text-gray-600">
                                {journey.utm_source && <div><span className="text-gray-400">Source:</span> {journey.utm_source}</div>}
                                {journey.utm_medium && <div><span className="text-gray-400">Medium:</span> {journey.utm_medium}</div>}
                                {journey.utm_campaign && <div><span className="text-gray-400">Campaign:</span> {journey.utm_campaign}</div>}
                                {!journey.utm_source && !journey.utm_medium && !journey.utm_campaign && <div className="text-gray-400 italic">No UTM data</div>}
                              </div>
                            </div>
                          </div>

                          {/* Engagement Stats */}
                          {journey.engagement.events_count > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Engagement</h4>
                              <div className="grid grid-cols-5 gap-2">
                                {[
                                  { label: 'Time Spent', value: fmtTime(journey.engagement.total_time), icon: <Clock size={14} /> },
                                  { label: 'Pages Viewed', value: journey.engagement.pages_viewed, icon: <Eye size={14} /> },
                                  { label: 'CTA Clicks', value: journey.engagement.cta_clicks, icon: <MousePointerClick size={14} /> },
                                  { label: 'Max Scroll', value: journey.engagement.max_scroll + '%', icon: <ChevronDown size={14} /> },
                                  { label: 'Device', value: journey.engagement.device || 'N/A', icon: <Globe size={14} /> },
                                ].map(e => (
                                  <div key={e.label} className="bg-gray-50 rounded-lg p-2.5 text-center">
                                    <div className="flex justify-center text-gray-400 mb-1">{e.icon}</div>
                                    <div className="text-sm font-semibold text-gray-800">{e.value}</div>
                                    <div className="text-[10px] text-gray-400">{e.label}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bookings */}
                          {journey.bookings.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Bookings ({journey.bookings.length})</h4>
                              <div className="space-y-2">
                                {journey.bookings.map(b => (
                                  <div key={b.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                                    <div>
                                      <div className="text-sm font-medium text-gray-800">{b.package_name || 'Custom Package'}</div>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                        {b.destination && <span className="flex items-center gap-1"><MapPin size={10} />{b.destination}</span>}
                                        {b.travelers && <span>{b.travelers} travelers</span>}
                                        {b.travel_date && <span>{new Date(b.travel_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusStyle(b.status)}`}>{b.status}</span>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${paymentStyle(b.payment_status)}`}>{b.payment_status}</span>
                                      <span className="text-sm font-semibold text-gray-800">{fmtCurrency(b.amount)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Journey Timeline */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Journey Timeline</h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                Lead Created — {new Date(journey.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </div>
                              {journey.assigned_employee_name && (
                                <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                  Assigned to {journey.assigned_employee_name}
                                </div>
                              )}
                              {journey.engagement.events_count > 0 && (
                                <div className="flex items-center gap-1.5 bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                                  {journey.engagement.events_count} engagement events
                                </div>
                              )}
                              {journey.bookings.map((b, i) => (
                                <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${b.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${b.payment_status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                  {b.status} — {fmtCurrency(b.amount)}
                                </div>
                              ))}
                              {journey.total_bookings === 0 && journey.engagement.events_count === 0 && (
                                <div className="flex items-center gap-1.5 bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full text-xs font-medium">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                  No activity yet
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">Failed to load tracking data. <button onClick={fetchTracking} className="text-blue-600 underline">Retry</button></div>
        )
      )}

      {/* Lead Details Modal */}
      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="bg-slate-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Lead Details</h3>
                    <p className="text-white/80 text-xs">Customer information</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-120px)]">
              {/* Lead Avatar & Basic Info */}
              <div className="bg-slate-100 rounded-lg p-3 border border-slate-200">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {selectedLead.name?.charAt(0)?.toUpperCase() || 'L'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-1">{selectedLead.name || 'N/A'}</h4>
                    <p className="text-gray-600 text-sm mb-2">{selectedLead.email || 'N/A'}</p>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-800">
                        <svg className="w-2 h-2 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {selectedLead.destination || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Contact Information</span>
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Email</span>
                    </div>
                    <p className="text-sm text-gray-900">{selectedLead.email || 'N/A'}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Phone</span>
                    </div>
                    <p className="text-sm text-gray-900">{selectedLead.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Travel Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Travel Information</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Travelers</span>
                    </div>
                    <p className="text-sm text-gray-900">{selectedLead.number_of_travelers || 'N/A'}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Travel Dates</span>
                    </div>
                    <p className="text-sm text-gray-900">{selectedLead.travel_dates || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Additional Information</span>
                </h4>
                <div className="space-y-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Source</span>
                    </div>
                    <p className="text-sm text-gray-900">{selectedLead.source}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Notes</span>
                    </div>
                    <p className="text-sm text-gray-900">{selectedLead.custom_notes || 'No notes'}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Submitted</span>
                    </div>
                    <p className="text-sm text-gray-900">{formatDate(selectedLead.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* UTM Tracking Information */}
              {(selectedLead.utm_source || selectedLead.utm_medium || selectedLead.utm_campaign) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>UTM Tracking</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedLead.utm_source && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="text-xs font-medium text-blue-700">UTM Source</span>
                        </div>
                        <p className="text-sm text-blue-900">{selectedLead.utm_source}</p>
                      </div>
                    )}
                    {selectedLead.utm_medium && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                          </svg>
                          <span className="text-xs font-medium text-blue-700">UTM Medium</span>
                        </div>
                        <p className="text-sm text-blue-900">{selectedLead.utm_medium}</p>
                      </div>
                    )}
                    {selectedLead.utm_campaign && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                          </svg>
                          <span className="text-xs font-medium text-blue-700">UTM Campaign</span>
                        </div>
                        <p className="text-sm text-blue-900">{selectedLead.utm_campaign}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-100 px-4 py-3 border-t border-slate-200">
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
               
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Lead Modal */}
      {showAssignModal && assigningLead && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="bg-slate-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Assign Lead</h3>
                    <p className="text-white/80 text-xs">Manage lead assignment</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAssignModal(false)} 
                  className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(85vh-100px)]">
              {/* Lead Info Card */}
              <div className="bg-slate-100 rounded-lg p-3 border border-slate-200">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {assigningLead.name?.charAt(0)?.toUpperCase() || 'L'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">{assigningLead.name}</h4>
                    <p className="text-gray-600 text-xs mb-1">{assigningLead.email}</p>
                    <div className="flex items-center space-x-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-800">
                        <svg className="w-2 h-2 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {assigningLead.destination}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Assignment Status */}
              {assigningLead.assigned_employee_id && (
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-800 mb-0.5">Currently Assigned</div>
                        <div className="text-sm font-semibold text-gray-900">{assigningLead.assigned_employee_name}</div>
                        <div className="text-xs text-gray-600">{assigningLead.assigned_employee_email}</div>
                      </div>
                    </div>
                    <button
                      onClick={handleUnassignLead}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors flex items-center space-x-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Unassign</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Search Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Available Employees</span>
                </h4>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-transparent transition-all"
                  />
                  <svg className="absolute left-2 top-2.5 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Employee List */}
              <div className="space-y-2">
                {loadingEmployees ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-800"></div>
                      <span className="text-gray-600 text-xs">Loading employees...</span>
                    </div>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-gray-600 text-xs">
                      {searchTerm ? 'No employees found matching your search.' : 'No employees found for this location.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {filteredEmployees.map(emp => {
                      const isAssigned = emp.id === assigningLead.assigned_employee_id
                      return (
                        <div 
                          key={emp.id} 
                          className={`p-2 rounded-lg border transition-all duration-200 ${
                            isAssigned 
                              ? 'bg-slate-100 border-slate-200 shadow-sm' 
                              : 'bg-white border-gray-200 hover:border-slate-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                isAssigned 
                                  ? 'bg-slate-800' 
                                  : 'bg-gray-400'
                              }`}>
                                <span className="text-white font-semibold text-xs">
                                  {emp.name?.charAt(0)?.toUpperCase() || 'E'}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-xs">{emp.name}</div>
                                <div className="text-xs text-gray-600">{emp.email}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {isAssigned ? (
                                <div className="flex items-center space-x-1">
                                  <div className="w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
                                  <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-xs font-medium">
                                    Assigned
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAssignLead(emp.id, emp.name, emp.email)}
                                  disabled={assigning}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                >
                                  {assigning ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      <span>Assigning...</span>
                                    </>
                                  ) : (
                                    <span>Assign</span>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-100 px-4 py-3 border-t border-slate-200">
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowAssignModal(false)} 
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-slate-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Create New Lead</h3>
                    <p className="text-white/80 text-xs">Add a new customer inquiry</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Basic Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Basic Information</span>
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newLead.name}
                      onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={newLead.email}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Contact Number *</label>
                    <input
                      type="tel"
                      value={newLead.phone}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)
                        setNewLead({ ...newLead, phone: digitsOnly })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              {/* Travel Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Travel Information</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Travellers</label>
                    <input
                      type="number"
                      value={newLead.number_of_travelers}
                      onChange={(e) => setNewLead({ ...newLead, number_of_travelers: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                      placeholder="Number of travelers"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Travel Dates</label>
                    <input
                      type="date"
                      value={newLead.travel_dates}
                      onChange={(e) => setNewLead({ ...newLead, travel_dates: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Destination</label>
                  {loadingDestinations ? (
                    <div className="flex items-center space-x-2 h-8">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-gray-500">Loading destinations...</span>
                    </div>
                  ) : (
                    <select
                      value={newLead.destination}
                      onChange={(e) => setNewLead({ ...newLead, destination: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select destination</option>
                      {destinations.map((destination, index) => (
                        <option key={`${destination}-${index}`} value={String(destination)}>
                          {String(destination)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Lead Source */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Lead Source</span>
                </h4>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lead From</label>
                  <select
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value, custom_source: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                  >
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Call">Call</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                {newLead.source === 'Custom' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Custom Source</label>
                    <input
                      type="text"
                      value={newLead.custom_source}
                      onChange={(e) => setNewLead({ ...newLead, custom_source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                      placeholder="Enter custom source"
                    />
                  </div>
                )}
              </div>

              {/* UTM Tracking (Optional) */}
              <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>UTM Tracking</span>
                  <span className="text-xs font-normal text-gray-500">(Optional)</span>
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">UTM Source</label>
                    <input
                      type="text"
                      value={newLead.utm_source}
                      onChange={(e) => setNewLead({ ...newLead, utm_source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="e.g., facebook, google, website"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">UTM Medium</label>
                      <input
                        type="text"
                        value={newLead.utm_medium}
                        onChange={(e) => setNewLead({ ...newLead, utm_medium: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                        placeholder="e.g., cpc, organic"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">UTM Campaign</label>
                      <input
                        type="text"
                        value={newLead.utm_campaign}
                        onChange={(e) => setNewLead({ ...newLead, utm_campaign: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                        placeholder="e.g., summer_sale"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                  <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Additional Notes</span>
                </h4>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newLead.custom_notes}
                    onChange={(e) => setNewLead({ ...newLead, custom_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                    placeholder="Enter any additional notes or comments"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-100 px-4 py-3 border-t border-slate-200">
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateLead}
                  disabled={isCreating}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors flex items-center space-x-1 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Create Lead</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && leadToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Lead Record</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Are you sure you want to delete this lead record?
                </h3>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Name:</strong> {leadToDelete.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {leadToDelete.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Phone:</strong> {leadToDelete.phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Destination:</strong> {leadToDelete.destination}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Source:</strong> {leadToDelete.source}
                  </p>
                </div>
                
                <p className="text-sm text-gray-500 mb-6">
                  This action cannot be undone. The lead record will be permanently removed from the database.
                </p>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteLead(leadToDelete.id)}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors disabled:opacity-50"
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete Record'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Leads
