'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '../../ui/card'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '../../ui/dropdown-menu'
import { Badge } from '../../ui/badge'
import { Loader2, Plus, MoreHorizontal, Copy, Pencil, Trash2, Search, MapPin, ArrowUp, ArrowDown, X } from 'lucide-react'
import { fetchApi, handleApiError } from '../../../lib/api'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://travelogerapi.travloger.in'

interface Itinerary {
  id: number
  name: string
  start_date: string | null
  end_date: string | null
  adults: number
  children: number
  destinations: string
  notes?: string
  price: number
  marketplace_shared: boolean
  created_at: string
  updated_at: string
  totalPrice?: number // Calculated total from all events

  // New Package Builder fields (support both snake_case from backend and camelCase)
  state?: string
  primaryDestination?: string
  primary_destination?: string
  otherDestinations?: string[]
  other_destinations?: string | string[]
  numDays?: number
  num_days?: number
  numNights?: number
  num_nights?: number
  packageType?: string
  package_type?: string
  packageCategory?: string
  package_category?: string
  packageTheme?: string
  package_theme?: string
  pickupPoint?: string
  pickup_point?: string
  dropPoint?: string
  drop_point?: string
  shortDescription?: string
  short_description?: string
  status?: string

  packageItineraries?: PackageItineraryDay[]
  package_itineraries?: string | PackageItineraryDay[]
  packageVehicles?: PackageVehicleOption[]
  package_vehicles?: string | PackageVehicleOption[]
  packageIncludes?: string[]
  package_includes?: string | string[]
  packageExcludes?: string[]
  package_excludes?: string | string[]
}

type PackageBuilderTab = 'general' | 'itineraries' | 'vehicles' | 'includes' | 'excludes'

const TAB_ORDER: PackageBuilderTab[] = ['general', 'itineraries', 'vehicles', 'includes', 'excludes']

interface PackageItineraryDay {
  id: string
  dayNumber: number
  dayItineraryId: number | null
}

interface PackageVehicleOption {
  id: string
  vehicleType: string
  capacity: number
  price: number
  acType: 'AC' | 'Non-AC'
}

const PACKAGE_TYPES = ['Private', 'Group']
const PACKAGE_CATEGORIES = ['Budget', 'Deluxe', 'Premium']

const Itineraries: React.FC = () => {
  const [rows, setRows] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<PackageBuilderTab>('general')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [destinations, setDestinations] = useState<Array<{ id: number; name: string; state?: string }>>([])
  const [showDestinationsDropdown, setShowDestinationsDropdown] = useState(false)
  const [destinationInput, setDestinationInput] = useState('')
  const [otherDestinationsInput, setOtherDestinationsInput] = useState('')
  const [showOtherDestinationsDropdown, setShowOtherDestinationsDropdown] = useState(false)
  const [states, setStates] = useState<Array<{ id: number; name: string; code?: string; status: string }>>([])
  const [packageThemes, setPackageThemes] = useState<Array<{ id: number; name: string; status: string }>>([])
  const [dayItineraries, setDayItineraries] = useState<Array<{ id: number; name: string; numDays: number; destinations?: string[] }>>([])
  const [vehicleTypes, setVehicleTypes] = useState<Array<{ id: number; vehicle_type: string; capacity?: number; state?: string }>>([])
  const [transfers, setTransfers] = useState<any[]>([])
  const [allInclusions, setAllInclusions] = useState<string[]>([])
  const [allExclusions, setAllExclusions] = useState<string[]>([])
  const navigate = useNavigate()

  // Function to calculate total price from all events
  const calculateTotalPrice = useCallback(async (itineraryId: number): Promise<number> => {
    try {
      const data = await fetchApi(`/api/itineraries/${itineraryId}/events`)
      const events = data.events || []

      let total = 0
      events.forEach((event: any) => {
        const eventData = event.event_data
        if (eventData && eventData.price) {
          // Parse price as number
          const price = typeof eventData.price === 'string'
            ? parseFloat(eventData.price)
            : eventData.price
          if (!isNaN(price)) {
            total += price
          }
        }
      })

      return total
    } catch (error) {
      console.error('Error calculating total price:', error)
      return 0
    }
  }, [])

  const [form, setForm] = useState({
    // Existing basic fields (kept for compatibility)
    name: '',
    startDate: '',
    endDate: '',
    adults: 1,
    children: 0,
    destinations: [] as string[],
    notes: '',

    // GENERAL tab fields
    state: '',
    primaryDestination: '',
    otherDestinations: [] as string[],
    numDays: 1,
    numNights: 0,
    packageType: '',
    packageCategory: '',
    packageTheme: '',
    pickupPoint: '',
    dropPoint: '',
    shortDescription: '',
    status: 'Active',

    // PACKAGE ITINERARIES
    packageItineraries: [] as PackageItineraryDay[],

    // PACKAGE VEHICLES
    packageVehicles: [] as PackageVehicleOption[],

    // INCLUDES / EXCLUDES
    packageIncludes: [] as string[],
    packageExcludes: [] as string[]
  })

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🔵 [FETCH] Calling /api/itineraries endpoint...')

      const data = await fetchApi('/api/itineraries')
      console.log('🔵 [FETCH] Raw response data:', data)
      // Helper function to parse JSONB fields
      const parseJsonb = (value: any) => {
        if (!value) return null
        if (typeof value === 'string') {
          try {
            return JSON.parse(value)
          } catch {
            return value
          }
        }
        return value
      }

      // Normalize backend data (snake_case to camelCase, parse JSONB)
      const itineraries = (data.itineraries || []).map((itinerary: any) => ({
        ...itinerary,
        primaryDestination: itinerary.primary_destination || itinerary.primaryDestination,
        otherDestinations: parseJsonb(itinerary.other_destinations) || itinerary.otherDestinations || [],
        numDays: itinerary.num_days || itinerary.numDays,
        numNights: itinerary.num_nights || itinerary.numNights,
        packageType: itinerary.package_type || itinerary.packageType,
        packageCategory: itinerary.package_category || itinerary.packageCategory,
        packageTheme: itinerary.package_theme || itinerary.packageTheme,
        pickupPoint: itinerary.pickup_point || itinerary.pickupPoint,
        dropPoint: itinerary.drop_point || itinerary.dropPoint,
        shortDescription: itinerary.short_description || itinerary.shortDescription,
        packageItineraries: parseJsonb(itinerary.package_itineraries) || itinerary.packageItineraries || [],
        packageVehicles: parseJsonb(itinerary.package_vehicles) || itinerary.packageVehicles || [],
        packageIncludes: parseJsonb(itinerary.package_includes) || itinerary.packageIncludes || [],
        packageExcludes: parseJsonb(itinerary.package_excludes) || itinerary.packageExcludes || []
      }))

      console.log('🔵 [FETCH] Normalized itineraries count:', itineraries.length)
      console.log('🔵 [FETCH] First itinerary sample:', itineraries[0])

      // Calculate total price for each itinerary
      console.log('🔵 [FETCH] Calculating total prices...')
      const itinerariesWithTotalPrice = await Promise.all(
        itineraries.map(async (itinerary: Itinerary) => {
          const totalPrice = await calculateTotalPrice(itinerary.id)
          return { ...itinerary, totalPrice }
        })
      )

      console.log('🔵 [FETCH] Final itineraries with prices:', itinerariesWithTotalPrice.length)
      console.log('🔵 [FETCH] Setting rows state with:', itinerariesWithTotalPrice)

      setRows(itinerariesWithTotalPrice)
      setError(null)

      console.log('✅ [FETCH] Successfully loaded', itinerariesWithTotalPrice.length, 'itineraries')
    } catch (error) {
      console.error('❌ [FETCH] Exception occurred:', error)
      setError('Failed to load itineraries')
    } finally {
      setLoading(false)
      console.log('🔵 [FETCH] Loading complete, loading state set to false')
    }
  }, [calculateTotalPrice])

  const fetchDestinations = useCallback(async (state?: string) => {
    try {
      const url = state
        ? `/api/destinations?state=${encodeURIComponent(state)}`
        : '/api/destinations'
      const data = await fetchApi(url)
      const activeDestinations = (data.destinations || [])
        .filter((d: any) => d.status === 'Active')
        .map((d: any) => ({ id: d.id, name: d.name, state: d.state }))
      setDestinations(activeDestinations)
    } catch (error) {
      console.error('Failed to fetch destinations:', handleApiError(error))
      setDestinations([])
    }
  }, [])

  // Handle state dropdown change with debugging (Fix for onChange not firing issue)
  const handleStateChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value
    console.log('🟢 [STATE CHANGE] Dropdown onChange triggered!')
    console.log('🟢 [STATE CHANGE] New state selected:', newState)

    setForm(prev => {
      console.log('🟢 [STATE CHANGE] Previous state:', prev.state)
      const updated = {
        ...prev,
        state: newState,
        primaryDestination: '', // Clear dependent fields when state changes
        otherDestinations: []
      }
      console.log('🟢 [STATE CHANGE] Form updated to:', updated.state)
      return updated
    })
  }, [])

  const fetchMasters = useCallback(async () => {
    try {
      // Fetch states
      try {
        console.log('🔵 [STATES] Fetching states from API...')
        const statesData = await fetchApi('/api/states')
        console.log('🔵 [STATES] Raw states data:', statesData)
        console.log('🔵 [STATES] States array:', statesData.states)
        console.log('🔵 [STATES] States count:', (statesData.states || []).length)
        const activeStates = (statesData.states || []).filter((s: any) => s.status === 'Active')
        console.log('🔵 [STATES] Active states count:', activeStates.length)
        console.log('🔵 [STATES] Active states:', activeStates)
        setStates(activeStates.map((s: any) => ({ id: s.id, name: s.name, code: s.code, status: s.status })))
        console.log('🔵 [STATES] States loaded successfully!')
      } catch (error) {
        console.error('❌ [STATES] Failed to fetch states:', handleApiError(error))
        setStates([])
      }

      // Fetch package themes
      try {
        const themesData = await fetchApi('/api/package-themes')
        const activeThemes = (themesData.packageThemes || []).filter((t: any) => t.status === 'Active')
        setPackageThemes(activeThemes.map((t: any) => ({ id: t.id, name: t.name, status: t.status })))
      } catch (error) {
        console.error('Failed to fetch package themes:', handleApiError(error))
        setPackageThemes([])
      }

      // Fetch day itineraries
      try {
        const dayItData = await fetchApi('/api/day-itineraries')
        const activeDayIts = (dayItData.dayItineraries || []).filter((d: any) => d.status === 'Active')
        setDayItineraries(activeDayIts.map((d: any) => ({
          id: d.id,
          name: d.name || d.title || '',
          numDays: d.numDays || d.num_days || 1,
          destinations: d.destinations || []
        })))
      } catch (error) {
        console.error('Failed to fetch day itineraries:', handleApiError(error))
        setDayItineraries([])
      }

      // Fetch vehicle types
      try {
        const vehicleTypesData = await fetchApi('/api/vehicle-types')
        const activeVehicleTypes = (vehicleTypesData.vehicleTypes || []).filter((v: any) => v.status === 'Active')
        setVehicleTypes(activeVehicleTypes.map((v: any) => ({
          id: v.id,
          vehicle_type: v.vehicle_type,
          capacity: v.capacity,
          state: v.state
        })))
      } catch (error) {
        console.error('Failed to fetch vehicle types:', handleApiError(error))
        setVehicleTypes([])
      }

      // Fetch transfers for automatic pricing
      try {
        const transfersData = await fetchApi('/transfers')
        setTransfers(transfersData.transfers || [])
      } catch (error) {
        console.error('Failed to fetch transfers:', handleApiError(error))
        setTransfers([])
      }

      // Fetch common inclusions/exclusions from the master library
      try {
        console.log('🔍 [NOTES] Fetching from /api/itinerary-notes-inclusions...')
        const notesData = await fetchApi('/api/itinerary-notes-inclusions')
        console.log('🔍 [NOTES] Raw response:', notesData)

        const activeNotes = (notesData.notesInclusions || []).filter((n: any) => {
          const status = (n.status || 'Active').toLowerCase();
          return status === 'active';
        })
        console.log('🔍 [NOTES] Active notes count:', activeNotes.length)

        const inclusions = activeNotes
          .filter((n: any) => {
            const cat = (n.category || '').toLowerCase()
            const title = (n.title || '').toLowerCase()
            const desc = (n.description || '').toLowerCase()

            // Inclusion if: category matches 'inc', OR title/desc has 'swim', OR it's NOT an exclusion
            const isExclusion = cat.includes('exc') || cat.includes('exclude') || cat === 'exclusion'
            const isSwim = title.includes('swim') || title.includes('swimi') || desc.includes('swim')
            const isMatch = (cat.includes('inc') || cat.includes('include') || cat === 'inclusion' || isSwim || !isExclusion)

            if (isMatch) console.log('✅ [NOTES] Found Inclusion match:', n.title)
            return isMatch
          })
          .map((n: any) => n.description || n.title)

        const exclusions = activeNotes
          .filter((n: any) => {
            const cat = (n.category || '').toLowerCase()
            const isMatch = cat.includes('exc') || cat.includes('exclude') || cat === 'exclusion'
            if (isMatch) console.log('✅ [NOTES] Found Exclusion match:', n.title)
            return isMatch
          })
          .map((n: any) => n.description || n.title)

        console.log('🔍 [NOTES] Final Inclusions:', inclusions)
        console.log('🔍 [NOTES] Final Exclusions:', exclusions)

        setAllInclusions(inclusions.length > 0 ? inclusions : [
          '2 nights stay (triple/couple sharing)',
          'Breakfast included',
          'Private AC vehicle for entire trip',
          'Toll charges',
          'Parking charges'
        ])

        setAllExclusions(exclusions.length > 0 ? exclusions : [
          'GST extra',
          'Personal expenses',
          'Lunch not included',
          'Anything not mentioned in inclusions'
        ])
      } catch (error) {
        console.error('❌ [NOTES] Failed to fetch inclusions/exclusions:', handleApiError(error))
        // Fallback to minimal defaults if fetch fails
        setAllInclusions(['Breakfast included', 'Private vehicle'])
        setAllExclusions(['GST extra', 'Personal expenses'])
      }
    } catch (error) {
      console.error('Error fetching masters:', handleApiError(error))
    }
  }, [showModal])

  // Fetch destinations when state changes
  useEffect(() => {
    if (form.state) {
      fetchDestinations(form.state)
    } else {
      // If no state selected, fetch all destinations
      fetchDestinations()
    }
    // Clear input when state changes
    setOtherDestinationsInput('')
    setShowOtherDestinationsDropdown(false)
  }, [form.state, fetchDestinations])

  // Clear primary destination and other destinations if they're not in the filtered destinations list
  useEffect(() => {
    if (form.state && destinations.length > 0) {
      const destinationNames = destinations.map(d => d.name)

      // Clear primary destination if it doesn't exist in filtered list
      if (form.primaryDestination && !destinationNames.includes(form.primaryDestination)) {
        setForm(prev => ({ ...prev, primaryDestination: '' }))
      }

      // Filter other destinations to only include those in the filtered list
      if (form.otherDestinations.length > 0) {
        const validOtherDestinations = form.otherDestinations.filter(dest =>
          destinationNames.includes(dest) && dest !== form.primaryDestination
        )
        if (validOtherDestinations.length !== form.otherDestinations.length) {
          setForm(prev => ({ ...prev, otherDestinations: validOtherDestinations }))
        }
      }
    }
  }, [destinations, form.state, form.primaryDestination, form.otherDestinations])

  // Ensure all destinations exist in master before creating/updating itinerary
  const ensureDestinationsExist = async (names: string[]): Promise<void> => {
    const trimmed = names.map(n => n.trim()).filter(Boolean)
    if (trimmed.length === 0) return
    const existingLower = new Set(destinations.map(d => d.name.toLowerCase()))
    const toCreate = trimmed.filter(n => !existingLower.has(n.toLowerCase()))
    if (toCreate.length === 0) return
    await Promise.all(
      toCreate.map(async (name) => {
        try {
          await fetchApi('/api/destinations', {
            method: 'POST',
            body: JSON.stringify({ name, state: form.state || '' })
          })
          // Refresh destinations list
          await fetchDestinations(form.state)
        } catch {
          // Ignore single insert failures; itinerary can still be created
        }
      })
    )
  }

  useEffect(() => {
    fetchRows()
    fetchMasters()
    // Don't fetch destinations here - will be fetched when state is selected
  }, [fetchRows, fetchMasters])

  const filtered = useMemo(() => {
    console.log('🟢 [FILTER] Starting filter process...')
    console.log('🟢 [FILTER] Total rows:', rows.length)
    console.log('🟢 [FILTER] Search query:', search)

    const q = search.trim().toLowerCase()
    const validRows = rows.filter(r => r && r.name) // Filter out undefined/null rows

    console.log('🟢 [FILTER] Valid rows (after null filter):', validRows.length)

    if (!q) {
      console.log('🟢 [FILTER] No search query, returning all', validRows.length, 'valid rows')
      return validRows
    }

    const filtered = validRows.filter(r => (r.name || '').toLowerCase().includes(q))
    console.log('🟢 [FILTER] Filtered rows (after search):', filtered.length)

    return filtered
  }, [rows, search])

  const filteredDestinations = useMemo(() => {
    if (!destinationInput.trim()) return destinations
    const query = destinationInput.toLowerCase()
    return destinations.filter(dest =>
      dest.name.toLowerCase().includes(query) && !form.destinations.includes(dest.name)
    ).slice(0, 5) // Limit to 5 suggestions
  }, [destinations, destinationInput, form.destinations])

  const filteredOtherDestinations = useMemo(() => {
    if (!form.state) return []
    // If input is empty, show all (filtered by exclusion), otherwise filter by query
    const query = otherDestinationsInput.trim().toLowerCase()

    return destinations
      .filter(dest => {
        // Exclude primary destination and already selected other destinations
        if (dest.name === form.primaryDestination) return false
        if (form.otherDestinations.includes(dest.name)) return false

        // If query exists, match start; otherwise show all
        if (query) {
          return dest.name.toLowerCase().includes(query)
        }
        return true
      })
      .slice(0, 50) // Increased limit to show more options in dropdown
  }, [destinations, otherDestinationsInput, form.state, form.primaryDestination, form.otherDestinations])

  const durationDays = (r: Itinerary): number | null => {
    if (!r.start_date || !r.end_date) return null
    const s = new Date(r.start_date)
    const e = new Date(r.end_date)
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return diff
  }

  const addDestination = (destination: string) => {
    if (destination.trim() && !form.destinations.includes(destination.trim())) {
      setForm({ ...form, destinations: [...form.destinations, destination.trim()] })
      setDestinationInput('')
      setShowDestinationsDropdown(false)
    }
  }

  const removeDestination = (destination: string) => {
    setForm({ ...form, destinations: form.destinations.filter(d => d !== destination) })
  }

  const handleDestinationKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (destinationInput.trim()) {
        addDestination(destinationInput.trim())
      }
    }
  }

  const addOtherDestination = (destination: string) => {
    if (destination.trim() && !form.otherDestinations.includes(destination.trim())) {
      setForm({ ...form, otherDestinations: [...form.otherDestinations, destination.trim()] })
      setOtherDestinationsInput('')
      setShowOtherDestinationsDropdown(false)
    }
  }

  const removeOtherDestination = (destination: string) => {
    setForm({ ...form, otherDestinations: form.otherDestinations.filter(d => d !== destination) })
  }

  const handleOtherDestinationKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredOtherDestinations.length > 0) {
        // Add first suggestion if available
        addOtherDestination(filteredOtherDestinations[0].name)
      } else if (otherDestinationsInput.trim()) {
        // Add typed text if no suggestions
        addOtherDestination(otherDestinationsInput.trim())
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-bold text-gray-900">Itineraries</h1>

            <div className="flex-1 max-w-xs">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <Input
                  placeholder="Search by name"
                  className="pl-7 py-1.5 text-sm rounded border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={() => {
                setEditingId(null)
                setForm({
                  name: '',
                  startDate: '',
                  endDate: '',
                  adults: 1,
                  children: 0,
                  destinations: [],
                  notes: '',
                  state: '',
                  primaryDestination: '',
                  otherDestinations: [],
                  numDays: 1,
                  numNights: 0,
                  packageType: '',
                  packageCategory: '',
                  packageTheme: '',
                  pickupPoint: '',
                  dropPoint: '',
                  shortDescription: '',
                  status: 'Active',
                  packageItineraries: [],
                  packageVehicles: [],
                  packageIncludes: [],
                  packageExcludes: []
                })
                setDestinationInput('')
                setActiveTab('general')
                setShowModal(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm rounded"
            >
              Create package
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 relative">
        {/* Content */}
        {!showModal && loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading itineraries...</p>
            </div>
          </div>
        ) : !showModal && error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-8 text-center">
              <div className="text-red-600 font-medium">{error}</div>
            </CardContent>
          </Card>
        ) : !showModal && filtered.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No itineraries found</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first package</p>
              <Button
                onClick={() => {
                  setEditingId(null)
                  setForm({
                    name: '',
                    startDate: '',
                    endDate: '',
                    adults: 1,
                    children: 0,
                    destinations: [],
                    notes: '',
                    state: '',
                    primaryDestination: '',
                    otherDestinations: [],
                    numDays: 1,
                    numNights: 0,
                    packageType: '',
                    packageCategory: '',
                    packageTheme: '',
                    pickupPoint: '',
                    dropPoint: '',
                    shortDescription: '',
                    status: 'Active',
                    packageItineraries: [],
                    packageVehicles: [],
                    packageIncludes: [],
                    packageExcludes: []
                  })
                  setDestinationInput('')
                  setActiveTab('general')
                  setShowModal(true)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First package
              </Button>
            </CardContent>
          </Card>
        ) : !showModal && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Place</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20"></th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <button
                            onClick={() => navigate(`/packages/${r.id}`)}
                            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {r.name}
                          </button>
                          <div className="text-xs text-gray-500 mt-1">
                            ID: {r.id} - {r.destinations} | {r.adults} Adult(s) - {r.children} Child(s)
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {durationDays(r) ? `${durationDays(r)} Days` : 'N/A'}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-yellow-100 text-gray-800">
                          ₹{(r.totalPrice || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={async () => {
                            try {
                              const data = await fetchApi(`/api/itineraries/${r.id}`, {
                                method: 'PUT',
                                body: JSON.stringify({
                                  marketplace_shared: !r.marketplace_shared
                                })
                              })
                              setRows(prev => prev.map(item =>
                                item.id === r.id
                                  ? { ...item, marketplace_shared: !item.marketplace_shared }
                                  : item
                              ))
                            } catch (error) {
                              console.error('Error updating marketplace status:', error)
                              alert(handleApiError(error, 'Error updating marketplace status'))
                            }
                          }}
                          className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium text-white cursor-pointer hover:opacity-80 transition-opacity ${r.marketplace_shared ? 'bg-green-500' : 'bg-red-500'
                            }`}
                        >
                          {r.marketplace_shared ? 'Shared' : 'Not Share'}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {new Date(r.updated_at || r.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center">
                              <MoreHorizontal className="w-4 h-4 text-gray-600" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => navigate(`/packages/${r.id}`)}
                              className="cursor-pointer"
                            >
                              <Search className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const safeParse = (val: any) => {
                                  if (!val) return []
                                  if (typeof val !== 'string') return val
                                  try { return JSON.parse(val) } catch(e) { return val.split(',').map((s:string)=>s.trim()).filter(Boolean) }
                                }
                                setEditingId(r.id)
                                setForm({
                                  name: r.name,
                                  startDate: r.start_date?.substring(0, 10) || '',
                                  endDate: r.end_date?.substring(0, 10) || '',
                                  adults: r.adults,
                                  children: r.children,
                                  destinations: r.destinations ? r.destinations.split(', ').filter(d => d.trim()) : [],
                                  notes: r.notes || '',
                                  state: r.state || '',
                                  primaryDestination: r.primary_destination || r.primaryDestination || '',
                                  otherDestinations: safeParse(r.other_destinations || r.otherDestinations),
                                  numDays: r.num_days || r.numDays || 1,
                                  numNights: r.num_nights || r.numNights || 0,
                                  packageType: r.package_type || r.packageType || '',
                                  packageCategory: r.package_category || r.packageCategory || '',
                                  packageTheme: r.package_theme || r.packageTheme || '',
                                  pickupPoint: r.pickup_point || r.pickupPoint || '',
                                  dropPoint: r.drop_point || r.dropPoint || '',
                                  shortDescription: r.short_description || r.shortDescription || '',
                                  status: r.status || 'Active',
                                  packageItineraries: safeParse(r.package_itineraries || r.packageItineraries),
                                  packageVehicles: safeParse(r.package_vehicles || r.packageVehicles),
                                  packageIncludes: safeParse(r.package_includes || r.packageIncludes),
                                  packageExcludes: safeParse(r.package_excludes || r.packageExcludes)
                                })
                                setDestinationInput('')
                                setActiveTab('general')
                                setShowModal(true)
                              }}
                              className="cursor-pointer"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit Itinerary
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  const payload = { ...r, name: `${r.name} Copy` }
                                  const data = await fetchApi('/api/itineraries', {
                                    method: 'POST',
                                    body: JSON.stringify(payload)
                                  })
                                  setRows(prev => [data.itinerary, ...prev])
                                } catch (error) {
                                  alert(handleApiError(error, 'Failed to duplicate'))
                                }
                              }}
                              className="cursor-pointer"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={async () => {
                            if (!window.confirm('Are you sure you want to delete this package?')) return
                            try {
                              await fetchApi(`/api/itineraries/${r.id}`, { method: 'DELETE' })
                              setRows(prev => prev.filter(x => x.id !== r.id))
                            } catch (error) {
                              alert(handleApiError(error, 'Failed to delete package'))
                            }
                          }}
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal - Full Screen in Main Content Area */}
        {showModal && (
          <div className="fixed top-[50px] right-0 bottom-0 lg:left-48 left-0 bg-white shadow-xl z-50 flex flex-col">
            {/* Tabs */}
            <div className="border-b border-gray-200 bg-white shrink-0">
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <nav className="flex text-xs font-medium text-gray-600 flex-1">
                  {[
                    { id: 'general', label: 'General' },
                    { id: 'itineraries', label: 'Package Itineraries' },
                    { id: 'vehicles', label: 'Package Vehicles' },
                    { id: 'includes', label: 'Includes' },
                    { id: 'excludes', label: 'Excludes' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as PackageBuilderTab)}
                      className={`flex-1 px-3 py-2 border-b-2 ${activeTab === tab.id
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-transparent hover:bg-gray-50'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 ml-2"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 3D/2N Gokarna – Hubli Pickup & Drop"
                      value={form.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <select
                        value={form.state}
                        onChange={(e) => {
                          console.log('🔴 [INLINE] onChange triggered!!!', e.target.value)
                          handleStateChange(e)
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      >
                        <option value="">Select state</option>
                        {states.map((state) => (
                          <option key={state.id} value={state.name}>
                            {state.name} {state.code ? `(${state.code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Destination
                      </label>
                      <select
                        value={form.primaryDestination}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setForm({ ...form, primaryDestination: e.target.value })
                        }
                        disabled={!form.state}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-black bg-white"
                      >
                        <option value="">
                          {form.state ? 'Select destination' : 'Select state first'}
                        </option>
                        {destinations.map((dest) => (
                          <option key={dest.id} value={dest.name}>
                            {dest.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Other Destinations
                      </label>
                      <input
                        type="text"
                        placeholder={form.state ? "Type to search destinations..." : "Select state first"}
                        value={otherDestinationsInput}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setOtherDestinationsInput(e.target.value)
                          setShowOtherDestinationsDropdown(true)
                        }}
                        onFocus={() => {
                          if (form.state) {
                            setShowOtherDestinationsDropdown(true)
                          }
                        }}
                        onBlur={() => {
                          // Delay to allow click on dropdown item
                          setTimeout(() => setShowOtherDestinationsDropdown(false), 200)
                        }}
                        onKeyDown={handleOtherDestinationKeyPress}
                        disabled={!form.state}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-black bg-white"
                      />
                      {showOtherDestinationsDropdown && filteredOtherDestinations.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {filteredOtherDestinations.map((dest) => (
                            <div
                              key={dest.id}
                              onMouseDown={(e) => {
                                e.preventDefault() // Prevent input blur
                                addOtherDestination(dest.name)
                              }}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                            >
                              {dest.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {form.otherDestinations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.otherDestinations.map((dest) => (
                        <span
                          key={dest}
                          className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm"
                        >
                          {dest}
                          <button
                            type="button"
                            onClick={() => {
                              setForm({
                                ...form,
                                otherDestinations: form.otherDestinations.filter(d => d !== dest)
                              })
                            }}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {!form.state && (
                    <p className="text-xs text-gray-500">Please select a state first to see destinations</p>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Days
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={form.numDays}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setForm({ ...form, numDays: e.target.value === '' ? ('' as any) : Number(e.target.value) })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Nights
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.numNights}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setForm({ ...form, numNights: e.target.value === '' ? ('' as any) : Number(e.target.value) })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Package Type
                      </label>
                      <select
                        value={form.packageType}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setForm({ ...form, packageType: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      >
                        <option value="">Select type</option>
                        {PACKAGE_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Package Category
                      </label>
                      <select
                        value={form.packageCategory}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setForm({ ...form, packageCategory: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      >
                        <option value="">Select category</option>
                        {PACKAGE_CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Package Theme
                      </label>
                      <select
                        value={form.packageTheme}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setForm({ ...form, packageTheme: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      >
                        <option value="">Select package theme</option>
                        {packageThemes.map((theme) => (
                          <option key={theme.id} value={theme.name}>
                            {theme.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={form.status}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setForm({ ...form, status: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pickup Point
                      </label>
                      <select
                        value={form.pickupPoint}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setForm({ ...form, pickupPoint: e.target.value })
                        }
                        disabled={!form.state}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-black bg-white"
                      >
                        <option value="">
                          {form.state ? 'Select pickup point' : 'Select state first'}
                        </option>
                        {destinations.map((dest) => (
                          <option key={dest.id} value={dest.name}>
                            {dest.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Drop Point
                      </label>
                      <select
                        value={form.dropPoint}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setForm({ ...form, dropPoint: e.target.value })
                        }
                        disabled={!form.state}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-black bg-white"
                      >
                        <option value="">
                          {form.state ? 'Select drop point' : 'Select state first'}
                        </option>
                        {destinations.map((dest) => (
                          <option key={dest.id} value={dest.name}>
                            {dest.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Short Description
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-black bg-white"
                      rows={3}
                      placeholder="Quick marketing summary for this package"
                      value={form.shortDescription}
                      onChange={e => setForm({ ...form, shortDescription: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* PACKAGE ITINERARIES Tab */}
              {activeTab === 'itineraries' && (
                <div className="space-y-4">
                  {!form.primaryDestination && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                      Please select a Primary Destination in the General tab first to see relevant itineraries.
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Day-wise Itinerary</h3>
                    <button
                      onClick={() => {
                        const newDay: PackageItineraryDay = {
                          id: `day-${Date.now()}`,
                          dayNumber: form.packageItineraries.length + 1,
                          dayItineraryId: null
                        }
                        setForm({ ...form, packageItineraries: [...form.packageItineraries, newDay] })
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      <Plus className="w-3 h-3" />
                      Add Day
                    </button>
                  </div>

                  {form.packageItineraries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No days added yet. Click "Add Day" to start building your itinerary.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {form.packageItineraries.map((day, index) => {
                        // Filter day itineraries based on selected destination
                        const filteredDayItineraries = dayItineraries.filter(it => {
                          if (!form.primaryDestination) return true
                          // Check if the itinerary includes the primary destination or other destinations
                          const allDestinations = [form.primaryDestination, ...form.otherDestinations]
                          return it.destinations && it.destinations.some(dest =>
                            allDestinations.some(selected =>
                              dest.toLowerCase().includes(selected.toLowerCase()) ||
                              selected.toLowerCase().includes(dest.toLowerCase())
                            )
                          )
                        })

                        return (
                          <div key={day.id} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="shrink-0 w-20">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Day {day.dayNumber}</label>
                              </div>
                              <div className="flex-1">
                                <select
                                  value={day.dayItineraryId || ''}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    const updated = [...form.packageItineraries]
                                    updated[index] = {
                                      ...day,
                                      dayItineraryId: e.target.value ? Number(e.target.value) : null
                                    }
                                    setForm({ ...form, packageItineraries: updated })
                                  }}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                                >
                                  <option value="">Select itinerary</option>
                                  {filteredDayItineraries.length === 0 && form.primaryDestination && (
                                    <option value="" disabled>No itineraries found for selected destinations</option>
                                  )}
                                  {filteredDayItineraries.map((it) => (
                                    <option key={it.id} value={it.id}>
                                      {it.name} ({it.numDays} day{it.numDays > 1 ? 's' : ''})
                                      {it.destinations && it.destinations.length > 0 && ` - ${it.destinations.join(', ')}`}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    if (index > 0) {
                                      const updated = [...form.packageItineraries]
                                      const temp = updated[index]
                                      updated[index] = { ...updated[index - 1], dayNumber: index + 1 }
                                      updated[index - 1] = { ...temp, dayNumber: index }
                                      setForm({ ...form, packageItineraries: updated })
                                    }
                                  }}
                                  disabled={index === 0}
                                  className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Move up"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (index < form.packageItineraries.length - 1) {
                                      const updated = [...form.packageItineraries]
                                      const temp = updated[index]
                                      updated[index] = { ...updated[index + 1], dayNumber: index + 1 }
                                      updated[index + 1] = { ...temp, dayNumber: index + 2 }
                                      setForm({ ...form, packageItineraries: updated })
                                    }
                                  }}
                                  disabled={index === form.packageItineraries.length - 1}
                                  className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Move down"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const updated = form.packageItineraries.filter((_, i) => i !== index)
                                    // Renumber days
                                    updated.forEach((d, i) => {
                                      d.dayNumber = i + 1
                                    })
                                    setForm({ ...form, packageItineraries: updated })
                                  }}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PACKAGE VEHICLES Tab */}
              {activeTab === 'vehicles' && (
                <div className="space-y-4">
                  {!form.state && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                      Please select a State in the General tab first. Vehicle pricing may vary by location.
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Vehicle Pricing for this Package</h3>
                    <button
                      onClick={() => {
                        const newVehicle: PackageVehicleOption = {
                          id: `vehicle-${Date.now()}`,
                          vehicleType: '',
                          capacity: 0,
                          price: 0,
                          acType: 'AC'
                        }
                        setForm({ ...form, packageVehicles: [...form.packageVehicles, newVehicle] })
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      <Plus className="w-3 h-3" />
                      Add Vehicle
                    </button>
                  </div>

                  {form.state && (
                    <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2">
                      <strong>Note:</strong> Pricing is for <strong>{form.state}</strong> - {form.primaryDestination || <span className="text-red-500 font-bold">Please select Primary Destination in General tab</span>}
                      {form.otherDestinations.length > 0 && ` & ${form.otherDestinations.join(', ')}`}
                    </div>
                  )}

                  {form.packageVehicles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No vehicles added yet. Click "Add Vehicle" to add pricing.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Vehicle Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 w-24">Capacity</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 w-32">Price</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 w-32">AC / Non-AC</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 w-20">Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.packageVehicles.map((vehicle, index) => (
                            <tr key={vehicle.id} className="border-b border-gray-200">
                              <td className="px-3 py-2">
                                <select
                                  value={vehicle.vehicleType}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    const selectedVT = vehicleTypes.find(vt => vt.vehicle_type === e.target.value)

                                    // Fetch price from transfers master
                                    // Match by vehicle_type and primaryDestination (case-insensitive)
                                    console.log('🔍 [PRICING] Searching for match:', {
                                      selectedVehicle: e.target.value,
                                      primaryDest: form.primaryDestination,
                                      availableTransfers: transfers.length
                                    });

                                    const matchingTransfer = transfers.find(t => {
                                      const tVehicle = (t.vehicle_type || '').toLowerCase().trim();
                                      const selectedVT = (e.target.value || '').toLowerCase().trim();
                                      const tDest = (t.destination || '').toLowerCase().trim();
                                      const pDest = (form.primaryDestination || '').toLowerCase().trim();

                                      const isMatch = tVehicle === selectedVT && tDest === pDest;
                                      if (isMatch) console.log('✅ [PRICING] Found match:', t);
                                      return isMatch;
                                    })

                                    if (!matchingTransfer) {
                                      console.log('❌ [PRICING] No match found in transfers master');
                                    }

                                    const updated = [...form.packageVehicles]
                                    updated[index] = {
                                      ...vehicle,
                                      vehicleType: e.target.value,
                                      capacity: selectedVT?.capacity || 0,
                                      price: matchingTransfer?.price || vehicle.price // Auto-fetch price
                                    }
                                    setForm({ ...form, packageVehicles: updated })
                                  }}
                                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                                >
                                  <option value="">Select type</option>
                                  {vehicleTypes
                                    .filter(vt => {
                                      // Strict filtering as per user feedback
                                      return vt.state === form.state
                                    })
                                    .map((vt) => (
                                      <option key={vt.id} value={vt.vehicle_type}>
                                        {vt.vehicle_type} {vt.capacity ? `(${vt.capacity} seats)` : ''}
                                      </option>
                                    ))}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <div className="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-sm text-gray-600">
                                  {vehicle.capacity ? `${vehicle.capacity} seats` : '-'}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={vehicle.price || ''}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const updated = [...form.packageVehicles]
                                    updated[index] = { ...vehicle, price: Number(e.target.value) || 0 }
                                    setForm({ ...form, packageVehicles: updated })
                                  }}
                                  placeholder="0"
                                  min={0}
                                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={vehicle.acType}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    const updated = [...form.packageVehicles]
                                    updated[index] = { ...vehicle, acType: e.target.value as 'AC' | 'Non-AC' }
                                    setForm({ ...form, packageVehicles: updated })
                                  }}
                                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                                >
                                  <option value="AC">AC</option>
                                  <option value="Non-AC">Non-AC</option>
                                </select>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => {
                                    setForm({
                                      ...form,
                                      packageVehicles: form.packageVehicles.filter((_, i) => i !== index)
                                    })
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* PACKAGE INCLUDES Tab */}
              {activeTab === 'includes' && (
                <div className="space-y-4">
                  {form.state && form.primaryDestination && (
                    <div className="text-xs text-gray-600 bg-green-50 border border-green-200 rounded p-2">
                      <strong>Package Context:</strong> {form.numDays}D/{form.numNights}N - {form.primaryDestination}, {form.state}
                      {form.otherDestinations.length > 0 && ` (+ ${form.otherDestinations.join(', ')})`}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Package Inclusions</h3>
                    <button
                      onClick={() => {
                        setForm({ ...form, packageIncludes: [...form.packageIncludes, ''] })
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      <Plus className="w-3 h-3" />
                      Add Custom Inclusion
                    </button>
                  </div>

                  {/* Common Inclusions - Quick Add */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Quick Add Common Inclusions:</label>
                    <div className="flex flex-wrap gap-2">
                      {allInclusions
                        .filter(inc => !form.packageIncludes.includes(inc))
                        .slice(0, 8)
                        .map((inclusion, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setForm({ ...form, packageIncludes: [...form.packageIncludes, inclusion] })
                            }}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                          >
                            + {inclusion}
                          </button>
                        ))}
                    </div>
                  </div>

                  {form.packageIncludes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No inclusions added yet. Use quick add buttons above or add custom inclusion.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Selected Inclusions:</label>
                      {form.packageIncludes.map((include, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={include}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const updated = [...form.packageIncludes]
                              updated[index] = e.target.value
                              setForm({ ...form, packageIncludes: updated })
                            }}
                            placeholder="e.g., 2 nights stay (triple/couple sharing)"
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                          />
                          <button
                            onClick={() => {
                              setForm({
                                ...form,
                                packageIncludes: form.packageIncludes.filter((_, i) => i !== index)
                              })
                            }}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PACKAGE EXCLUDES Tab */}
              {activeTab === 'excludes' && (
                <div className="space-y-4">
                  {form.state && form.primaryDestination && (
                    <div className="text-xs text-gray-600 bg-green-50 border border-green-200 rounded p-2">
                      <strong>Package Context:</strong> {form.numDays}D/{form.numNights}N - {form.primaryDestination}, {form.state}
                      {form.otherDestinations.length > 0 && ` (+ ${form.otherDestinations.join(', ')})`}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Package Exclusions</h3>
                    <button
                      onClick={() => {
                        setForm({ ...form, packageExcludes: [...form.packageExcludes, ''] })
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      <Plus className="w-3 h-3" />
                      Add Custom Exclusion
                    </button>
                  </div>

                  {/* Common Exclusions - Quick Add */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Quick Add Common Exclusions:</label>
                    <div className="flex flex-wrap gap-2">
                      {allExclusions
                        .filter(exc => !form.packageExcludes.includes(exc))
                        .slice(0, 8)
                        .map((exclusion, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setForm({ ...form, packageExcludes: [...form.packageExcludes, exclusion] })
                            }}
                            className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200"
                          >
                            + {exclusion}
                          </button>
                        ))}
                    </div>
                  </div>

                  {form.packageExcludes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No exclusions added yet. Use quick add buttons above or add custom exclusion.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Selected Exclusions:</label>
                      {form.packageExcludes.map((exclude, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={exclude}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const updated = [...form.packageExcludes]
                              updated[index] = e.target.value
                              setForm({ ...form, packageExcludes: updated })
                            }}
                            placeholder="e.g., GST extra"
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                          />
                          <button
                            onClick={() => {
                              setForm({
                                ...form,
                                packageExcludes: form.packageExcludes.filter((_, i) => i !== index)
                              })
                            }}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons - Sticky */}
            <div className="flex gap-2 p-3 border-t border-gray-200 bg-white shrink-0">
              {/* Previous Button - Show on all tabs except first */}
              {activeTab !== 'general' && (
                <button
                  onClick={() => {
                    const currentIndex = TAB_ORDER.indexOf(activeTab)
                    if (currentIndex > 0) {
                      setActiveTab(TAB_ORDER[currentIndex - 1])
                    }
                  }}
                  className="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              )}

              {/* Spacer to push Next/Create to the right */}
              <div className="flex-1" />

              {/* Next Button - Show on all tabs except last */}
              {activeTab !== 'excludes' && (
                <button
                  onClick={() => {
                    const currentIndex = TAB_ORDER.indexOf(activeTab)
                    if (currentIndex < TAB_ORDER.length - 1) {
                      setActiveTab(TAB_ORDER[currentIndex + 1])
                    }
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                >
                  Next
                </button>
              )}

              {/* Create Package Button - Show only on last tab */}
              {activeTab === 'excludes' && (
                <button
                  disabled={saving}
                  onClick={async () => {
                    // Validation
                    if (!form.name.trim()) {
                      alert('Please enter package name')
                      setActiveTab('general')
                      return
                    }
                    if (!form.state) {
                      alert('Please select a state')
                      setActiveTab('general')
                      return
                    }
                    if (!form.primaryDestination) {
                      alert('Please select a primary destination')
                      setActiveTab('general')
                      return
                    }
                    try {
                      setSaving(true)
                      const endpoint = editingId ? `/api/itineraries/${editingId}` : '/api/itineraries'
                      const method = editingId ? 'PUT' : 'POST'

                      console.log('='.repeat(60))
                      console.log('🟣 [SAVE] Starting save operation...')
                      console.log('🟣 [SAVE] Endpoint:', endpoint)
                      console.log('🟣 [SAVE] Method:', method)
                      console.log('🟣 [SAVE] Editing ID:', editingId)
                      console.log('🟣 [SAVE] Target Database Table: PACKAGES')
                      console.log('🟣 [SAVE] Note: API route is /api/itineraries but saves to PACKAGES table in database')
                      console.log('='.repeat(60))

                      // Build destinations string from primaryDestination and otherDestinations
                      const allDestinations = [form.primaryDestination, ...form.otherDestinations].filter(Boolean)
                      const destinationsString = allDestinations.join(', ') || form.primaryDestination || ''

                      const payload = {
                        name: form.name,
                        startDate: form.startDate || null,
                        endDate: form.endDate || null,
                        adults: form.adults,
                        children: form.children,
                        destinations: destinationsString,
                        notes: form.notes || null,
                        // Package Builder Fields
                        state: form.state,
                        primaryDestination: form.primaryDestination,
                        otherDestinations: form.otherDestinations,
                        numDays: Number(form.numDays) || 1,
                        numNights: Number(form.numNights) || 0,
                        packageType: form.packageType,
                        packageCategory: form.packageCategory,
                        packageTheme: form.packageTheme,
                        pickupPoint: form.pickupPoint,
                        dropPoint: form.dropPoint,
                        shortDescription: form.shortDescription,
                        packageItineraries: form.packageItineraries,
                        packageVehicles: form.packageVehicles,
                        packageIncludes: form.packageIncludes,
                        packageExcludes: form.packageExcludes,
                        status: form.status
                      }

                      console.log('🟣 [SAVE] Payload:', payload)

                      const data = await fetchApi(endpoint, {
                        method,
                        body: JSON.stringify(payload)
                      })

                      console.log('🟣 [SAVE] SUCCESS! Package saved to database')
                      console.log('🟣 [SAVE] Table Used: PACKAGES')
                      console.log('🟣 [SAVE] Package ID:', data.itinerary?.id)
                      console.log('🟣 [SAVE] Package Name:', data.itinerary?.name)
                      console.log('🟣 [SAVE] Database Operation: ' + (editingId ? 'UPDATE' : 'INSERT'))
                      console.log('🟣 [SAVE] Saved Package Data:', data.itinerary)

                      if (data.itinerary) {
                        console.log('='.repeat(60))
                        console.log('✅ [SAVE] SUCCESS! Package saved to database')
                        if (editingId) {
                          console.log('🟣 [SAVE] Updating existing itinerary in state')
                          setRows(prev => prev.map(r => (r.id === editingId ? data.itinerary : r)))
                        } else {
                          console.log('🟣 [SAVE] Adding new itinerary to state')
                          setRows(prev => [data.itinerary, ...prev])
                        }
                        console.log('🟣 [SAVE] Refreshing list from server...')
                        await fetchRows() // Refresh the list
                        console.log('🟣 [SAVE] Closing modal and resetting form')
                        setShowModal(false)
                        setEditingId(null)
                        setForm({
                          name: '',
                          startDate: '',
                          endDate: '',
                          adults: 1,
                          children: 0,
                          destinations: [],
                          notes: '',
                          state: '',
                          primaryDestination: '',
                          otherDestinations: [],
                          numDays: 1,
                          numNights: 0,
                          packageType: '',
                          packageCategory: '',
                          packageTheme: '',
                          pickupPoint: '',
                          dropPoint: '',
                          shortDescription: '',
                          status: 'Active',
                          packageItineraries: [],
                          packageVehicles: [],
                          packageIncludes: [],
                          packageExcludes: []
                        })
                        setDestinationInput('')
                        setOtherDestinationsInput('')
                        setActiveTab('general')
                      }
                    } catch (error) {
                      console.log('='.repeat(60))
                      console.error('❌ [SAVE] EXCEPTION! Package was NOT saved to database')
                      console.error('❌ [SAVE] Exception:', error)
                      console.log('='.repeat(60))
                      handleApiError(error)
                    } finally {
                      setSaving(false)
                      console.log('🟣 [SAVE] Save operation complete')
                    }
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin inline" />
                      {editingId ? 'Saving...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 mr-1 inline" />
                      {editingId ? 'Save Changes' : 'Create Package'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Itineraries
