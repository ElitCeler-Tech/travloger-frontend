'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchApi, handleApiError } from '../../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Car,
  CheckCircle,
  XCircle,
  Edit,
  Loader2,
  Clock,
  Info,
  Map,
  Package
} from 'lucide-react'
import { HeroSection } from './PackageDetails/HeroSection'
import { AboutSection } from './PackageDetails/AboutSection'
import { ItinerarySection } from './PackageDetails/ItinerarySection'


const PackageDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [packageData, setPackageData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Fetch package data
  useEffect(() => {
    const fetchPackageData = async () => {
      if (!id) return

      try {
        setLoading(true)
        setError(null)

        // Fetch package details
        const data = await fetchApi(`/api/itineraries/${id}`)
        const pkg = data.itinerary

        if (!pkg) {
          throw new Error('Package not found')
        }

        // Parse JSONB fields
        const normalizedPackage = {
          ...pkg,
          other_destinations: parseJsonb(pkg.other_destinations) || [],
          package_itineraries: parseJsonb(pkg.package_itineraries) || [],
          package_vehicles: parseJsonb(pkg.package_vehicles) || [],
          package_includes: parseJsonb(pkg.package_includes) || [],
          package_excludes: parseJsonb(pkg.package_excludes) || [],
          pricing_data: parseJsonb(pkg.pricing_data) || {},
          summary_highlights: parseJsonb(pkg.summary_highlights) || [],
          package_inclusions_structured: parseJsonb(pkg.package_inclusions_structured) || [],
          reviews: parseJsonb(pkg.reviews) || [],
          testimonials: parseJsonb(pkg.testimonials) || [],
          why_choose_us: parseJsonb(pkg.why_choose_us) || {},
          our_partners: parseJsonb(pkg.our_partners) || [],
          stories_highlights: parseJsonb(pkg.stories_highlights) || [],
          vision_about: parseJsonb(pkg.vision_about) || {},
          faqs: parseJsonb(pkg.faqs) || [],
          site_content: parseJsonb(pkg.site_content) || {},
        }

        // Compute total price from pricing_data or fallback to price field
        const pricingData = normalizedPackage.pricing_data
        const adults = normalizedPackage.adults || 1
        const children = normalizedPackage.children || 0
        const adultPrice = pricingData?.adultPrice || normalizedPackage.price || 0
        const childPrice = pricingData?.childPrice || 0
        normalizedPackage.totalPrice = (adultPrice * adults) + (childPrice * children)
        normalizedPackage.gstPercent = pricingData?.gst || 5

        setPackageData(normalizedPackage)
      } catch (err) {
        console.error('Error fetching package:', handleApiError(err))
        setError(handleApiError(err))
      } finally {
        setLoading(false)
      }
    }

    fetchPackageData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading package details...</p>
        </div>
      </div>
    )
  }

  if (error || !packageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full border-red-200 bg-red-50">
          <CardContent className="py-8 text-center">
            <div className="text-red-600 font-medium mb-4">{error || 'Package not found'}</div>
            <Button onClick={() => navigate('/packages')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Packages
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Parse other_destinations - handle both string ("Nubra Valley, Pangong Lake") and array formats
  const otherDestinations: string[] = (() => {
    const od = packageData.other_destinations
    if (Array.isArray(od)) return od
    if (typeof od === 'string') return od.split(',').map((s: string) => s.trim()).filter(Boolean)
    return []
  })()

  const packageItineraries = Array.isArray(packageData.package_itineraries)
    ? packageData.package_itineraries
    : []
  const packageVehicles = Array.isArray(packageData.package_vehicles)
    ? packageData.package_vehicles
    : []
  const packageIncludes = Array.isArray(packageData.package_includes)
    ? packageData.package_includes
    : []
  const packageExcludes = Array.isArray(packageData.package_excludes)
    ? packageData.package_excludes
    : []

  // Collect all images from itinerary days for the hero carousel
  const heroImages: string[] = packageItineraries
    .flatMap((day: any) => day.images || [])
    .filter((img: string) => img && !img.includes('example.com'))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      {/* Hero Section */}
      <HeroSection
        packageData={packageData}
        heroImages={heroImages}
      />

      {/* About Section */}
      <AboutSection packageData={packageData} />

      {/* Itinerary Section */}
      {packageItineraries.length > 0 && (
        <ItinerarySection
          packageData={packageData}
          packageItineraries={packageItineraries}
        />
      )}

      {/* Admin Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/packages')}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Actions</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                className={`${packageData.status === 'Active'
                  ? 'bg-green-100 text-green-800'
                  : packageData.status === 'Draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                  }`}
              >
                {packageData.status || 'Active'}
              </Badge>
              <Badge
                className={`${packageData.marketplace_shared
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'
                  }`}
              >
                {packageData.marketplace_shared ? 'Marketplace Shared' : 'Not Shared'}
              </Badge>
              <Button
                onClick={() => navigate(`/packages/${id}/edit`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Package
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Package Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {packageData.short_description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                    <p className="text-gray-600">{packageData.short_description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">State</p>
                      <p className="text-gray-900">{packageData.state || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Map className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Primary Destination</p>
                      <p className="text-gray-900">{packageData.primary_destination || 'N/A'}</p>
                    </div>
                  </div>

                  {otherDestinations.length > 0 && (
                    <div className="flex items-start gap-3 col-span-2">
                      <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Other Destinations</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {otherDestinations.map((dest: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              {dest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Duration</p>
                      <p className="text-gray-900">{packageData.num_days || 0}D / {packageData.num_nights || 0}N</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Travelers</p>
                      <p className="text-gray-900">{packageData.adults || 0} Adults, {packageData.children || 0} Children</p>
                    </div>
                  </div>

                  {packageData.package_type && (
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-teal-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Package Type</p>
                        <p className="text-gray-900">{packageData.package_type}</p>
                      </div>
                    </div>
                  )}

                  {packageData.package_category && (
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-pink-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Category</p>
                        <p className="text-gray-900">{packageData.package_category}</p>
                      </div>
                    </div>
                  )}

                  {packageData.package_theme && (
                    <div className="flex items-start gap-3 col-span-2">
                      <Package className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Theme</p>
                        <p className="text-gray-900">{packageData.package_theme}</p>
                      </div>
                    </div>
                  )}

                  {packageData.pickup_point && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Pickup Point</p>
                        <p className="text-gray-900">{packageData.pickup_point}</p>
                      </div>
                    </div>
                  )}

                  {packageData.drop_point && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Drop Point</p>
                        <p className="text-gray-900">{packageData.drop_point}</p>
                      </div>
                    </div>
                  )}
                </div>

                {packageData.notes && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                    <p className="text-gray-600 text-sm">{packageData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>



            {/* Vehicle Options */}
            {packageVehicles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Vehicle Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vehicle Type</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Model</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">AC Type</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {packageVehicles.map((vehicle: any, idx: number) => {
                          const isString = typeof vehicle === 'string'
                          return (
                            <tr key={vehicle.id || idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{isString ? vehicle : vehicle.vehicleType}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{isString ? '-' : vehicle.model}</td>
                              <td className="px-4 py-3">
                                {isString ? '-' : (
                                  <Badge variant={vehicle.acType === 'AC' ? 'default' : 'outline'}>
                                    {vehicle.acType}
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900">
                                {isString ? '-' : (vehicle.price ? `₹${Number(vehicle.price).toLocaleString()}` : 'N/A')}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {packageIncludes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      Inclusions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {packageIncludes.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {packageExcludes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <XCircle className="w-5 h-5" />
                      Exclusions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {packageExcludes.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <DollarSign className="w-5 h-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Total Package Price</p>
                  <p className="text-4xl font-bold text-blue-900">
                    ₹{(packageData.totalPrice || 0).toLocaleString()}
                  </p>
                  {packageData.price && packageData.price > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Base Price: ₹{packageData.price.toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dates Card */}
            {(packageData.start_date || packageData.end_date) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Travel Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {packageData.start_date && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Start Date</p>
                      <p className="text-gray-900">
                        {new Date(packageData.start_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {packageData.end_date && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">End Date</p>
                      <p className="text-gray-900">
                        {new Date(packageData.end_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Meta Information */}
            <Card>
              <CardHeader>
                <CardTitle>Meta Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Created</p>
                  <p className="text-gray-600">
                    {packageData.created_at
                      ? new Date(packageData.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Last Updated</p>
                  <p className="text-gray-600">
                    {packageData.updated_at
                      ? new Date(packageData.updated_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      : 'N/A'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PackageDetails
