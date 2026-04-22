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
  const [reportData, setReportData] = useState<any[]>([])
  const [engagementReport, setEngagementReport] = useState<EngagementReport | null>(null)
  const [lpTables, setLpTables] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [generatingReport, setGeneratingReport] = useState<boolean>(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch report data based on selections
  const fetchReportData = useCallback(async () => {
    setLoading(true)
    try {
      if (selectedSection === 'landing_page_analytics') {
        setReportData([])
        setAnalytics(null)
        const params = new URLSearchParams()
        if (selectedLocation !== 'all') {
          params.set('landing_page', selectedLocation.toLowerCase())
        }
        if (selectedMonth !== 'all' || selectedYear !== 'all') {
          const year = selectedYear !== 'all' ? parseInt(selectedYear) : new Date().getFullYear()
          const month = selectedMonth !== 'all' ? parseInt(selectedMonth) : 1
          if (selectedMonth !== 'all') {
            params.set('start_date', new Date(year, month - 1, 1).toISOString().split('T')[0])
            params.set('end_date', new Date(year, month, 0).toISOString().split('T')[0])
          } else {
            params.set('start_date', new Date(year, 0, 1).toISOString().split('T')[0])
            params.set('end_date', new Date(year, 11, 31).toISOString().split('T')[0])
          }
        }
        const data = await fetchApi(`/api/engagement/report?${params.toString()}`)
        setEngagementReport(data || null)

        // Also fetch the full landing page report tables (Overview Dashboard, Traffic Trend, etc.)
        const lpParams = new URLSearchParams()
        lpParams.set('section', 'landing_page_analytics')
        if (selectedLocation !== 'all') lpParams.set('destination', selectedLocation)
        if (params.get('start_date')) lpParams.set('start_date', params.get('start_date')!)
        if (params.get('end_date')) lpParams.set('end_date', params.get('end_date')!)
        try {
          const lpData = await fetchApi(`/api/reports?${lpParams.toString()}`)
          setLpTables(lpData?.landing_page_analytics || lpData?.landing_page || [])
        } catch { setLpTables([]) }
        return
      }

      setEngagementReport(null)
      const queryParams = new URLSearchParams()
      queryParams.append('section', selectedSection)
      if (selectedLocation !== 'all') {
        queryParams.append('destination', selectedLocation)
      }
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
  }, [selectedLocation, selectedSection, selectedMonth, selectedYear])

  // Generate and download report
  const downloadExcelReport = async () => {
    setGeneratingReport(true)
    try {
      const isEngagement = selectedSection === 'landing_page_analytics'
      const payload: any = {
        section: isEngagement ? 'landing_page' : (selectedSection as string),
        destination: selectedLocation !== 'all' ? selectedLocation : undefined,
        format: isEngagement ? 'pdf' : 'csv'
      }
      
      if (isEngagement) {
        payload.generate_link = true
      }

      // Convert month/year to date range if specified
      if (selectedMonth !== 'all' || selectedYear !== 'all') {
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

      if (isEngagement) {
        const data = await fetchApi('/api/reports/export', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        
        const urlToOpen = data.link || data.url || data.file_url || data.download_url || (data.data && (data.data.link || data.data.url))
        
        if (urlToOpen) {
          const link = document.createElement('a')
          link.href = urlToOpen
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          setSuccessMessage('Report opened successfully in a new tab.')
        } else {
          console.error("Link not found in response:", data)
          alert('Report generated but no link was returned. Check console for details.')
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
            <button
              onClick={downloadExcelReport}
              disabled={generatingReport || ((selectedSection === 'landing_page_analytics' && !engagementReport) || (selectedSection !== 'landing_page_analytics' && reportData.length === 0))}
              className="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {generatingReport ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{selectedSection === 'landing_page_analytics' ? 'Download PDF' : 'Download CSV'}</span>
                </>
              )}
            </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Location Selection */}
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

            {/* Month Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="all">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="all">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
              </select>
            </div>
          </div>

          {/* Report Summary */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Report Summary:</span>{' '}
                {selectedSection === 'landing_page_analytics'
                  ? 'Engagement by landing page and section'
                  : `${selectedSection.toUpperCase()} data for ${selectedLocation === 'all' ? 'All Locations' : selectedLocation}`}
                {selectedMonth !== 'all' && ` in ${new Date(0, parseInt(selectedMonth) - 1).toLocaleString('default', { month: 'long' })}`}
                {selectedYear !== 'all' && ` ${selectedYear}`}
              </div>
              <div className="text-sm font-medium text-gray-900">
                {loading ? 'Loading...' : selectedSection === 'landing_page_analytics'
                  ? (engagementReport ? `${engagementReport.by_landing_page.length} pages, ${engagementReport.by_section.length} section rows` : 'No data')
                  : `${reportData.length} records found`}
              </div>
            </div>
            {!loading && selectedSection !== 'landing_page_analytics' && reportData.length === 0 && (
              <div className="mt-2 text-sm text-amber-600">
                ⚠️ No data found for the selected filters. Try adjusting your location, month, or year selection.
              </div>
            )}
            {!loading && selectedSection === 'landing_page_analytics' && engagementReport && engagementReport.by_landing_page.length === 0 && engagementReport.by_section.length === 0 && (
              <div className="mt-2 text-sm text-amber-600">
                ⚠️ No engagement data yet. Data appears when users view landing pages and sections on Travloger.
              </div>
            )}
          </div>
        </div>

        {/* Engagement Report (by landing page & section) */}
        {selectedSection === 'landing_page_analytics' && engagementReport && (
          <div className="mt-4 space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-gray-700">
              <strong>Note:</strong> Engagement is tracked by <strong>anonymous session</strong> (no username). Each visitor gets a session ID. To see which <strong>section</strong> gets the most attention, use the <strong>By section</strong> table below — rows are sorted by <strong>Total sec</strong> (highest first), so the section at the top is where users spend the most time.
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">By landing page</h3>
                  <p className="text-sm text-gray-600">Total time and sessions per page</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Landing page</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total sec</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sessions</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Events</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {engagementReport.by_landing_page.map((row, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.landing_page || '—'}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{row.total_seconds}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{row.unique_sessions}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{row.event_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">By section</h3>
                  <p className="text-sm text-gray-600">Sorted by total time (most engaged section first). Page:section e.g. ladakh:reviews</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Page : Section</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total sec</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sessions</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Events</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[...engagementReport.by_section]
                        .sort((a, b) => (b.total_seconds || 0) - (a.total_seconds || 0))
                        .map((row, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 text-sm text-gray-900">{row.landing_page_section || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">{row.total_seconds}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{row.unique_sessions}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{row.event_count}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
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

