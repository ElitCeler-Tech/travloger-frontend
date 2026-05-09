import React, { useState, useEffect, useCallback } from 'react'
import { fetchApi, handleApiError } from '../../../lib/api'
import ErrorBoundary from '../../ErrorBoundary'
import TrafficTrendChart from '../../charts/TrafficTrendChart'

type SectionType = 'website_analytics' | 'landing_page_analytics' | 'itinerary_analytics' | 'sales_analytics' | 'accounts_analytics'
type LocationType = 'all' | 'Kashmir' | 'Ladakh' | 'Kerala' | 'Gokarna' | 'Meghalaya' | 'Mysore' | 'Singapore' | 'Hyderabad' | 'Bengaluru' | 'Manali'

type EngagementReport = {
  by_landing_page: { landing_page: string; total_seconds: number; unique_sessions: number; event_count: number }[]
  by_section: { landing_page_section: string; total_seconds: number; unique_sessions: number; event_count: number }[]
  filters?: { landing_page?: string; start_date?: string; end_date?: string }
}

const Reports: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<LocationType>('all')
  const [selectedSection, setSelectedSection] = useState<SectionType>('website_analytics')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [selectedDevice, setSelectedDevice] = useState<string>('all')
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all')
  const [selectedLandingPage, setSelectedLandingPage] = useState<string>('all')
  const [selectedPackage, setSelectedPackage] = useState<string>('all')
  const [reportData, setReportData] = useState<any[]>([])
  const [engagementReport, setEngagementReport] = useState<EngagementReport | null>(null)
  const [lpTables, setLpTables] = useState<any[]>([])
  const [lpOverview, setLpOverview] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<boolean>(false)
  const [generatingReport, setGeneratingReport] = useState<boolean>(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [packageOptions, setPackageOptions] = useState<{id: string, name: string}[]>([])
  const [campaignOptions, setCampaignOptions] = useState<string[]>([])
  const [datePreset, setDatePreset] = useState<string>('month')

  // Date preset helper
  const applyDatePreset = (preset: string) => {
    setDatePreset(preset)
    setSelectedMonth('all'); setSelectedYear('all')
    const today = new Date()
    const fmt = (d: Date) => d.toISOString().split('T')[0]
    if (preset === 'today') {
      setStartDate(fmt(today)); setEndDate(fmt(today))
    } else if (preset === 'yesterday') {
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
      setStartDate(fmt(yesterday)); setEndDate(fmt(yesterday))
    } else if (preset === 'week') {
      const start = new Date(today); start.setDate(today.getDate() - today.getDay())
      setStartDate(fmt(start)); setEndDate(fmt(today))
    } else if (preset === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      setStartDate(fmt(start)); setEndDate(fmt(today))
    } else {
      setStartDate(''); setEndDate('')
    }
  }

  // Apply default date preset on mount
  useEffect(() => {
    applyDatePreset('month')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch package & campaign options when landing page changes
  useEffect(() => {
    if (selectedSection !== 'landing_page_analytics') return
    setSelectedPackage('all')
    setSelectedCampaign('all')

    // Fetch packages from DB filtered by destination (so all packages show, not just ones with events)
    const pkgUrl = selectedLandingPage !== 'all'
      ? `/api/packages/city/${encodeURIComponent(selectedLandingPage)}`
      : `/api/packages`
    fetchApi(pkgUrl)
      .then((data: any) => {
        const pkgs = data?.packages || []
        if (pkgs.length) {
          setPackageOptions(pkgs.map((p: any) => ({ id: p.id, name: p.name || p.title })))
        } else if (selectedLandingPage !== 'all') {
          // Fallback: fetch all packages and filter client-side
          fetchApi('/api/packages').then((allData: any) => {
            const all = allData?.packages || []
            const filtered = all.filter((p: any) => {
              const search = selectedLandingPage.toLowerCase()
              return (p.name || '').toLowerCase().includes(search) ||
                (p.primary_destination || '').toLowerCase().includes(search) ||
                (p.destinations || '').toLowerCase().includes(search) ||
                (p.state || '').toLowerCase().includes(search)
            })
            setPackageOptions((filtered.length ? filtered : all).map((p: any) => ({ id: p.id, name: p.name || p.title })))
          }).catch(() => setPackageOptions([]))
        } else {
          setPackageOptions([])
        }
      })
      .catch(() => setPackageOptions([]))

    // Fetch campaign options from engagement events as before
    const params = new URLSearchParams({ section: 'landing_page_analytics' })
    if (selectedLandingPage !== 'all') params.set('landing_page', selectedLandingPage)
    fetchApi(`/api/reports?${params.toString()}`)
      .then((data: any) => {
        const tables = data?.landing_page_analytics || data?.landing_page || []
        const campTable = tables.find((t: any) => t.title === 'Campaign Performance')
        if (campTable?.rows) setCampaignOptions(campTable.rows.map((r: string[]) => r[0]).filter((c: string) => c && c !== 'none' && c !== 'Direct Visitor / Untracked Campaign'))
        else setCampaignOptions([])
      })
      .catch(() => setCampaignOptions([]))
  }, [selectedLandingPage, selectedSection])

  // Fetch report data based on selections
  const fetchReportData = useCallback(async () => {
    setLoading(true)
    try {
      if (selectedSection === 'landing_page_analytics') {
        setReportData([])
        setAnalytics(null)
        setLpOverview({})

        // Build params for the full landing page report (single API call)
        const lpParams = new URLSearchParams()
        lpParams.set('section', 'landing_page_analytics')
        if (selectedLandingPage !== 'all') lpParams.set('landing_page', selectedLandingPage)
        if (selectedPackage !== 'all') lpParams.set('package_id', selectedPackage)
        if (selectedSource !== 'all') lpParams.set('source', selectedSource)
        if (selectedDevice !== 'all') lpParams.set('device', selectedDevice)
        if (selectedCampaign !== 'all') lpParams.set('campaign', selectedCampaign)

        if (startDate) lpParams.set('start_date', startDate)
        if (endDate) lpParams.set('end_date', endDate)
        if (!startDate && !endDate) {
          if (selectedMonth !== 'all' || selectedYear !== 'all') {
            const year = selectedYear !== 'all' ? parseInt(selectedYear) : new Date().getFullYear()
            const month = selectedMonth !== 'all' ? parseInt(selectedMonth) : 1
            if (selectedMonth !== 'all') {
              lpParams.set('start_date', new Date(year, month - 1, 1).toISOString().split('T')[0])
              lpParams.set('end_date', new Date(year, month, 0).toISOString().split('T')[0])
            } else {
              lpParams.set('start_date', new Date(year, 0, 1).toISOString().split('T')[0])
              lpParams.set('end_date', new Date(year, 11, 31).toISOString().split('T')[0])
            }
          }
        }

        try {
          const lpData = await fetchApi(`/api/reports?${lpParams.toString()}`)
          const tables = lpData?.landing_page_analytics || lpData?.landing_page || []
          // Extract overview dashboard into a key-value map for cards
          const overviewTable = tables.find((t: any) => t.title === 'Overview Dashboard')
          if (overviewTable) {
            const map: Record<string, string> = {}
            overviewTable.rows.forEach((r: string[]) => { map[r[0]] = r[1] })
            setLpOverview(map)
          }
          // Set remaining tables (exclude Overview Dashboard — shown as cards)
          setLpTables(tables.filter((t: any) => t.title !== 'Overview Dashboard'))
          // Extract campaign options from Campaign Performance table
          const campTable = tables.find((t: any) => t.title === 'Campaign Performance')
          if (campTable?.rows) {
            setCampaignOptions(campTable.rows.map((r: string[]) => r[0]).filter((c: string) => c && c !== 'none' && c !== 'Direct Visitor / Untracked Campaign'))
          }
          // Extract package options from Package Performance table (only add if initial fetch returned nothing)
          const pkgTable = tables.find((t: any) => t.title === 'Package Performance')
          if (pkgTable?.rows?.length && packageOptions.length === 0) {
            setPackageOptions(pkgTable.rows.map((r: string[]) => ({ id: r[0], name: r[0] })))
          }
          setEngagementReport(null)
        } catch {
          setLpTables([])
          setEngagementReport(null)
        }
        return
      }

      setEngagementReport(null)
      const queryParams = new URLSearchParams()
      queryParams.append('section', selectedSection)
      if (selectedLocation !== 'all') {
        queryParams.append('destination', selectedLocation)
      }
      if (startDate) {
        queryParams.append('start_date', startDate)
      }
      if (endDate) {
        queryParams.append('end_date', endDate)
      }
      if (!startDate && !endDate) {
        if (selectedMonth !== 'all' || selectedYear !== 'all') {
          const year = selectedYear !== 'all' ? parseInt(selectedYear) : new Date().getFullYear()
          const month = selectedMonth !== 'all' ? parseInt(selectedMonth) : 1
          if (selectedMonth !== 'all') {
            queryParams.append('start_date', new Date(year, month - 1, 1).toISOString().split('T')[0])
            queryParams.append('end_date', new Date(year, month, 0).toISOString().split('T')[0])
          } else if (selectedYear !== 'all') {
            queryParams.append('start_date', new Date(year, 0, 1).toISOString().split('T')[0])
            queryParams.append('end_date', new Date(year, 11, 31).toISOString().split('T')[0])
          }
        }
      }

      const data = await fetchApi(`/api/reports?${queryParams.toString()}`)
      if (data) {
        const rawData = data[selectedSection] || []
        setReportData(rawData)
        const analyticsData = await fetchApi(`/api/reports/analytics?${queryParams.toString()}`)
        setAnalytics(analyticsData?.analytics || null)
      } else {
        setReportData([])
        setAnalytics(null)
      }
    } catch (error) {
      console.error('Error fetching report data:', handleApiError(error))
      setReportData([])
      setEngagementReport(null)
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }, [selectedLocation, selectedSection, selectedMonth, selectedYear, startDate, endDate, selectedSource, selectedDevice, selectedCampaign, selectedLandingPage, selectedPackage])

  // Generate and download report
  const downloadReport = async (format: 'csv' | 'pdf' = 'csv') => {
    setGeneratingReport(true)
    try {
      const isLP = selectedSection === 'landing_page_analytics'
      const payload: any = {
        section: isLP ? 'landing_page' : (selectedSection as string),
        destination: !isLP && selectedLocation !== 'all' ? selectedLocation : undefined,
        format,
        generate_link: format === 'pdf',
      }
      if (isLP) {
        if (selectedLandingPage !== 'all') payload.landing_page = selectedLandingPage
        if (selectedPackage !== 'all') payload.package_id = selectedPackage
        if (selectedSource !== 'all') payload.source = selectedSource
        if (selectedDevice !== 'all') payload.device = selectedDevice
        if (selectedCampaign !== 'all') payload.campaign = selectedCampaign
      }

      // Convert date range or month/year to date range
      if (startDate) payload.start_date = startDate
      if (endDate) payload.end_date = endDate
      if (!startDate && !endDate && (selectedMonth !== 'all' || selectedYear !== 'all')) {
        const year = selectedYear !== 'all' ? parseInt(selectedYear) : new Date().getFullYear()
        const month = selectedMonth !== 'all' ? parseInt(selectedMonth) : 1
        if (selectedMonth !== 'all') {
          payload.start_date = new Date(year, month - 1, 1).toISOString().split('T')[0]
          payload.end_date = new Date(year, month, 0).toISOString().split('T')[0]
        } else if (selectedYear !== 'all') {
          payload.start_date = new Date(year, 0, 1).toISOString().split('T')[0]
          payload.end_date = new Date(year, 11, 31).toISOString().split('T')[0]
        }
      }

      if (format === 'pdf') {
        const data = await fetchApi('/api/reports/export', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        const urlToOpen = data.link || data.url || data.file_url || data.download_url || (data.data && (data.data.link || data.data.url))
        if (urlToOpen) {
          window.open(urlToOpen, '_blank')
          setSuccessMessage('Report opened in a new tab.')
        } else {
          alert('Report generated but no link was returned.')
        }
      } else {
        const blob = await fetchApi('/api/reports/export', {
          method: 'POST',
          body: JSON.stringify(payload),
          responseType: 'blob'
        })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        // Generate filename based on selections
        const locationStr = selectedLocation === 'all' ? 'All-Locations' : selectedLocation
        const monthStr = selectedMonth === 'all' ? 'All-Months' : selectedMonth
        const yearStr = selectedYear === 'all' ? 'All-Years' : selectedYear
        const filename = `${selectedSection.toUpperCase()}-Report-${locationStr}-${monthStr}-${yearStr}-${new Date().toISOString().split('T')[0]}.csv`

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        setSuccessMessage(`Report downloaded successfully: ${filename}`)
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert(handleApiError(error))
    } finally {
      setGeneratingReport(false)
    }
  }

  // Fetch data when selections change
  useEffect(() => {
    if (selectedLocation && selectedSection && selectedMonth && selectedYear) {
      fetchReportData()
    }
  }, [selectedLocation, selectedSection, selectedMonth, selectedYear, fetchReportData])

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-500">Generate detailed reports based on location, section, and time period</p>
          </div>
          <div className="flex items-center space-x-2">
            {selectedSection === 'landing_page_analytics' ? (
              <>
                <button
                  onClick={() => downloadReport('csv')}
                  disabled={generatingReport || lpTables.length === 0}
                  className="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => downloadReport('pdf')}
                  disabled={generatingReport || lpTables.length === 0}
                  className="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.href); setSuccessMessage('Report link copied to clipboard.') }}
                  className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-sm flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  <span>Share</span>
                </button>
              </>
            ) : (
            <button
              onClick={() => downloadReport('csv')}
              disabled={generatingReport || reportData.length === 0}
              className="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {generatingReport ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span>Download CSV</span>
                </>
              )}
            </button>
            )}
          </div>
        </div>

        {/* Analytics Summary Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedSection === 'website_analytics' && (
              <>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Total Leads</div>
                  <div className="text-2xl font-bold text-blue-600">{analytics.total || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Top Destination</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Object.keys(analytics.byDestination || {})[0] || 'N/A'}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Top Source</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Object.keys(analytics.bySource || {})[0] || 'N/A'}
                  </div>
                </div>
              </>
            )}
            {selectedSection === 'itinerary_analytics' && (
              <>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Total Itineraries</div>
                  <div className="text-2xl font-bold text-green-600">{analytics.total || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">By Status</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {analytics.byStatus ? Object.entries(analytics.byStatus).map(([k, v]) => `${k}: ${v}`).join(', ') : 'N/A'}
                  </div>
                </div>
              </>
            )}

            {selectedSection === 'accounts_analytics' && (
              <>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Total Calculations</div>
                  <div className="text-2xl font-bold text-blue-600">{analytics.totalCalculations || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Total Profit</div>
                  <div className={`text-2xl font-bold ${(analytics.totalGrossProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{analytics.totalGrossProfit || 0}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Avg Margin</div>
                  <div className={`text-2xl font-bold ${(analytics.avgProfitMargin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(analytics.avgProfitMargin || 0).toFixed(2)}%
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Profitable Trips</div>
                  <div className="text-2xl font-bold text-green-600">{analytics.profitableTrips || 0}</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Report Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className={`grid grid-cols-1 md:grid-cols-2 ${selectedSection === 'landing_page_analytics' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
            {/* Location Selection — hidden for landing page analytics (uses Landing Page filter instead) */}
            {selectedSection !== 'landing_page_analytics' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value as LocationType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="all">All Locations</option>
                <option value="Kashmir">Kashmir</option>
                <option value="Ladakh">Ladakh</option>
                <option value="Kerala">Kerala</option>
                <option value="Gokarna">Gokarna</option>
                <option value="Meghalaya">Meghalaya</option>
                <option value="Mysore">Mysore</option>
                <option value="Singapore">Singapore</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Manali">Manali</option>
              </select>
            </div>
            )}

            {/* Section Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value as SectionType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="website_analytics">Website Analytics</option>
                <option value="landing_page_analytics">Landing Page Analytics</option>
                <option value="itinerary_analytics">Itinerary Analytics</option>
                <option value="sales_analytics">Sales Analytics</option>
                <option value="accounts_analytics">Accounts Analytics</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className={selectedSection === 'landing_page_analytics' ? 'col-span-1 md:col-span-2' : 'col-span-1 md:col-span-2'}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range
                {startDate && <span className="ml-2 font-normal text-gray-500">
                  ({startDate.split('-').reverse().join('/')}{endDate && endDate !== startDate ? ` — ${endDate.split('-').reverse().join('/')}` : ''})
                </span>}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'all', label: 'All Time' },
                  { key: 'yesterday', label: 'Yesterday' },
                  { key: 'today', label: 'Today' },
                  { key: 'week', label: 'This Week' },
                  { key: 'month', label: 'This Month' },
                  { key: 'custom', label: 'Custom' },
                ].map(p => (
                  <button key={p.key} onClick={() => { if (p.key === 'custom') { setDatePreset('custom') } else { applyDatePreset(p.key) } }}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${datePreset === p.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              {datePreset === 'custom' && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-0.5">Date</label>
                      <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value); setSelectedMonth('all'); setSelectedYear('all') }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-0.5">To (optional, for range)</label>
                      <input type="date" value={endDate} min={startDate} onChange={(e) => { setEndDate(e.target.value); setSelectedMonth('all'); setSelectedYear('all') }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Pick one date for a single day, or two dates for a range</p>
                </div>
              )}
            </div>
          </div>

          {/* Landing Page Specific Filters */}
          {selectedSection === 'landing_page_analytics' && (
            <div className={`grid grid-cols-1 md:grid-cols-3 ${campaignOptions.length > 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4 mt-4`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landing Page</label>
                <select value={selectedLandingPage} onChange={(e) => setSelectedLandingPage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
                  <option value="all">All Pages</option>
                  <option value="kashmir">Kashmir</option>
                  <option value="ladakh">Ladakh</option>
                  <option value="kerala">Kerala</option>
                  <option value="gokarna">Gokarna</option>
                  <option value="meghalaya">Meghalaya</option>
                  <option value="manali">Manali</option>
                  <option value="singapore">Singapore</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package {packageOptions.length > 0 && <span className="text-gray-400 font-normal">({packageOptions.length})</span>}</label>
                <select value={selectedPackage} onChange={(e) => setSelectedPackage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
                  <option value="all">All Packages</option>
                  {packageOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
                  <option value="all">All Sources</option>
                  <option value="meta">Meta Ads</option>
                  <option value="google">Google</option>
                  <option value="organic">Organic</option>
                  <option value="direct">Direct</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device</label>
                <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
                  <option value="all">All Devices</option>
                  <option value="mobile">Mobile</option>
                  <option value="desktop">Desktop</option>
                  <option value="tablet">Tablet</option>
                </select>
              </div>
              {campaignOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
                <select value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
                  <option value="all">All Campaigns</option>
                  {campaignOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              )}
            </div>
          )}

          {/* Report Summary */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Report Summary:</span>{' '}
                {selectedSection === 'landing_page_analytics'
                  ? 'Engagement by landing page and section'
                  : `${selectedSection.toUpperCase()} data for ${selectedLocation === 'all' ? 'All Locations' : selectedLocation}`}
                {startDate && ` from ${startDate}`}
                {endDate && ` to ${endDate}`}
              </div>
              <div className="text-sm font-medium text-gray-900">
                {loading ? 'Loading...' : selectedSection === 'landing_page_analytics'
                  ? (lpTables.length > 0 ? `${lpTables.length} report tables loaded` : 'No data')
                  : `${reportData.length} records found`}
              </div>
            </div>
            {!loading && selectedSection !== 'landing_page_analytics' && reportData.length === 0 && (
              <div className="mt-2 text-sm text-amber-600">
                ⚠️ No data found for the selected filters. Try adjusting your location or date range.
              </div>
            )}
            {!loading && selectedSection === 'landing_page_analytics' && lpTables.length === 0 && Object.keys(lpOverview).length === 0 && (
              <div className="mt-2 text-sm text-amber-600">
                ⚠️ No engagement data yet. Data appears when users view landing pages on Travloger.
              </div>
            )}
          </div>
        </div>

        {/* Landing Page Analytics — Overview Cards */}
        {selectedSection === 'landing_page_analytics' && Object.keys(lpOverview).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { key: 'Total Visitors', color: 'text-blue-600' },
              { key: 'Unique Visitors', color: 'text-indigo-600' },
              { key: 'Total Sessions', color: 'text-purple-600' },
              { key: 'Total Leads', color: 'text-green-600' },
              { key: 'Lead Conversion %', color: 'text-emerald-600' },
              { key: 'Avg Time per Session', color: 'text-orange-600' },
              { key: 'Avg Scroll Depth', color: 'text-cyan-600' },
              { key: 'CTA Click Rate', color: 'text-red-600' },
              { key: 'Top Landing Page', color: 'text-gray-900', isText: true },
              { key: 'Top Campaign', color: 'text-gray-900', isText: true },
            ].map(({ key, color, isText }) => (
              <div key={key} className="bg-white p-4 rounded-lg shadow">
                <div className="text-xs text-gray-500 mb-1">{key}</div>
                <div className={`${isText ? 'text-sm font-semibold capitalize' : 'text-xl font-bold'} ${color}`}>
                  {lpOverview[key] || '0'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full Landing Page Report Tables */}
        {selectedSection === 'landing_page_analytics' && lpTables.length > 0 && (
          <div className="space-y-6">
            {lpTables.map((table: any, idx: number) => (
              <div key={idx} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900">{table.title}</h3>
                </div>
                {table.title === 'Traffic Trend (Day-wise)' && (table.rows || []).length > 0 && (
                  <div className="px-6 py-4">
                    <TrafficTrendChart rows={table.rows} />
                  </div>
                )}
                {table.title === 'Sessions vs Leads' && (table.rows || []).length > 0 && (
                  <div className="px-6 py-4">
                    <TrafficTrendChart rows={table.rows} />
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        {(table.headers || []).map((h: string, i: number) => (
                          <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(table.rows || []).length === 0 ? (
                        <tr><td colSpan={(table.headers || []).length} className="px-4 py-6 text-center text-sm text-gray-400">No data</td></tr>
                      ) : (table.rows || []).map((row: string[], ri: number) => (
                        <tr key={ri} className="hover:bg-gray-50">
                          {row.map((cell: string, ci: number) => (
                            <td key={ci} className={`px-4 py-3 text-sm ${ci === 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Data Preview */}
        {reportData.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Data Preview</h3>
              <p className="text-sm text-gray-600">Preview of {reportData.length} records that will be included in the CSV report</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {selectedSection === 'website_analytics' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      </>
                    )}
                    {selectedSection === 'sales_analytics' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Mobile</th>
                      </>
                    )}
                    {selectedSection === 'itinerary_analytics' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days/Nights</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      </>
                    )}

                    {selectedSection === 'accounts_analytics' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin %</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.slice(0, 10).map((item: any, index: number) => (
                    <tr key={index}>
                      {selectedSection === 'website_analytics' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.phone || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.source || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.destination || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.created_at).toLocaleDateString()}</td>
                        </>
                      )}
                      {selectedSection === 'sales_analytics' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.customer || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.amount || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.payment_status || item.paymentStatus || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.payment_method || item.paymentMethod || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.payment_date || item.paymentDate || item.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.assigned_employee_name || item.assignedEmployeeName || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.assigned_employee_mobile || item.assignedEmployeeMobile || 'N/A'}</td>
                        </>
                      )}
                      {selectedSection === 'itinerary_analytics' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.primary_destination || item.destinations || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.num_days || 0}D / {item.num_nights || 0}N</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.price || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.status || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.created_at).toLocaleDateString()}</td>
                        </>
                      )}

                      {selectedSection === 'accounts_analytics' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.trip_id || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.customer_name || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.total_revenue || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.total_expenses || 0}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${item.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{item.gross_profit || 0}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${item.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(item.profit_margin || 0).toFixed(2)}%
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.length > 10 && (
                <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
                  Showing first 10 of {reportData.length} records. All records will be included in the CSV download.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-white/10 transition-opacity">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-auto transform transition-all p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-center text-gray-900 mb-2">Success</h3>
            <p className="text-sm text-center text-gray-600 mb-6">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </ErrorBoundary>
  )
}

export default Reports

