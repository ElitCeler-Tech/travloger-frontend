import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronDown, Play } from 'lucide-react'

interface ItinerarySectionProps {
  packageData: any
  packageItineraries: any[]
}

// Fallback images
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
]

export const ItinerarySection: React.FC<ItinerarySectionProps> = ({
  packageData,
  packageItineraries,
}) => {
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({})

  const toggleDay = (key: string) => {
    setExpandedDays((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Use package start_date if available, otherwise use today
  const startDate = packageData.start_date ? new Date(packageData.start_date) : new Date()

  // Get pricing info
  const pricingData = packageData.pricing_data || {}
  const adults = packageData.adults || 1
  const adultPrice = pricingData.adultPrice || packageData.price || 0
  const gstPercent = pricingData.gst || 5
  const totalPrice = packageData.totalPrice || adultPrice * adults

  // Get valid images from a day (filter out example.com placeholders)
  const getValidImages = (dayObj: any): string[] => {
    const imgs = dayObj.images || []
    return imgs.filter((img: string) => img && !img.includes('example.com'))
  }

  // Get fallback image for a destination
  const getDestinationImage = (destination: string, index: number): string => {
    return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
  }

  // All itinerary images for thumbnail stacks
  const allValidImages = packageItineraries.flatMap(getValidImages)

  // The itineraries are already day-by-day.
  // In the reference design, days are grouped by destination location.
  // Since the API gives us a flat list, we treat the primary_destination as the single group.
  const destination = packageData.primary_destination || packageData.destinations || 'Destination'

  return (
    <div className="w-full bg-[#fafafa] py-12 md:py-20" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@300;400;500;600;700&display=swap');
        .font-bebas { font-family: 'Bebas Neue', sans-serif; }
        .font-northwell { font-family: 'Northwell', cursive; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        {/* Section Title: "Itinerary YOU'LL LOVE" */}
        <div className="relative mb-12 md:mb-16 flex items-center justify-between">
          <div className="relative">
            <h2
              className="text-5xl md:text-7xl text-[#f27a3a] font-northwell font-light italic absolute -top-8 left-0 whitespace-nowrap z-10"
              style={{ transform: 'rotate(-4deg)' }}
            >
              Itinerary
            </h2>
            <h1 className="text-5xl md:text-8xl font-bebas text-gray-200 tracking-wider leading-none mt-4">
              YOU'LL LOVE
            </h1>
          </div>
          {/* Temple decorative icon */}
          <div className="hidden md:block text-[#f27a3a]">
            <svg width="56" height="72" viewBox="0 0 56 72" fill="none">
              <path d="M28 2L32 12H24L28 2Z" fill="#f27a3a"/>
              <rect x="26" y="12" width="4" height="3" fill="#d4a574"/>
              <path d="M28 15L36 25H20L28 15Z" fill="#f27a3a"/>
              <rect x="24" y="25" width="8" height="3" fill="#d4a574"/>
              <path d="M28 28L40 38H16L28 28Z" fill="#f27a3a"/>
              <rect x="22" y="38" width="12" height="4" fill="#d4a574"/>
              <path d="M28 42L46 54H10L28 42Z" fill="#f27a3a"/>
              <rect x="18" y="54" width="20" height="8" fill="#d4a574"/>
              <rect x="16" y="62" width="24" height="8" fill="#e8c5a0"/>
            </svg>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="w-full flex flex-col lg:flex-row gap-8 items-start relative">

          {/* Left Column */}
          <div className="flex-1 w-full min-w-0">

            {/* Trip Summary Header */}
            <div className="mb-8">
              <div className="text-gray-400 text-lg md:text-xl flex items-baseline gap-1.5">
                <span className="text-gray-800 font-semibold">{packageData.partner_name || "OM's"}</span>
                <span>{packageData.num_days || 0} Days trip to</span>
              </div>
              <div className="text-4xl md:text-5xl font-bold text-[#f27a3a] mt-1 tracking-tight">
                {destination}
              </div>
              <div className="mt-4 inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full text-sm text-gray-600 font-medium border border-gray-200">
                {packageData.num_days || 0}D
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                <span className="text-gray-300">|</span>
                {packageData.num_nights || 0}N
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              </div>
            </div>

            <div className="flex flex-col rounded-xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-gray-200 mt-2 bg-white">
              {/* Location Banner */}
              <div className="relative w-full h-56 md:h-[280px] shrink-0">
                <img
                  src={allValidImages[0] || getDestinationImage(destination, 0)}
                  alt={destination}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                {/* Overlay Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="text-4xl md:text-5xl lg:text-[60px] text-[#f27a3a] font-northwell font-light italic leading-none -mb-3 md:-mb-6 mr-8"
                    style={{ transform: 'rotate(-5deg)' }}
                  >
                    {packageItineraries.length} days in
                  </span>
                  <h2 className="text-5xl md:text-7xl lg:text-[85px] font-bebas text-white tracking-widest uppercase drop-shadow-md">
                    {destination}
                  </h2>
                </div>
                {/* Bottom pagination */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  <div className="bg-white/80 backdrop-blur-sm px-3 py-0.5 rounded-full text-[10px] font-semibold text-gray-700">
                    {allValidImages.length > 0 ? `1/${allValidImages.length}` : '—'}
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                </div>
                {/* Avatar circles */}
                {allValidImages.length > 0 && (
                  <div className="absolute bottom-3 right-4 flex items-center -space-x-2 z-10">
                    {allValidImages.slice(0, 2).map((img, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-[1.5px] border-white overflow-hidden shadow-sm">
                        <img alt="" src={img} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {allValidImages.length > 2 && (
                      <div className="w-8 h-8 rounded-full bg-[#fff4ef] border-[1.5px] border-white flex items-center justify-center text-[10px] font-bold text-[#f27a3a] shadow-sm relative z-20">
                        +{allValidImages.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Timeline List */}
              <div className="relative px-4 md:px-8 py-8 lg:py-10">
                {/* Removing absolute global line for a flexbox-based per-item line */}
                
                {packageItineraries.map((dayObj: any, index: number) => {
                  const dayNum = dayObj.day || (index + 1)
                  const title = dayObj.title || `Day ${dayNum}`
                  const description = dayObj.description || ''
                  const dayImages = getValidImages(dayObj)
                  const videoUrl = dayObj.videoUrl || ''
                  const dayDate = new Date(startDate.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000)
                  const isExpanded = !!expandedDays[`day-${index}`]
                  const isLast = index === packageItineraries.length - 1

                  return (
                    <div key={index} className="relative z-10 flex items-stretch gap-4 md:gap-6">
                      {/* Flex Timeline Column: line - dot - line */}
                      <div className="flex flex-col items-center w-[18px] shrink-0">
                        {/* Top Line to connect to previous dot */}
                        <div className={`w-[1.5px] h-7 ${index === 0 ? 'bg-transparent' : 'bg-[#f2a87a]'}`} />
                        
                        {/* The Dot */}
                        <div className="shrink-0 w-[14px] h-[14px] rounded-full bg-[#f27a3a] border-[3px] border-white shadow ring-1 ring-orange-200 z-10" />
                        
                        {/* Bottom Line extending to next dot */}
                        <div className={`w-[1.5px] flex-1 ${isLast ? 'bg-transparent' : 'bg-[#f2a87a]'}`} />
                      </div>

                      {/* Day Content Card Wrapper */}
                      <div className={`flex-1 min-w-0 ${!isLast ? 'pb-6 md:pb-8' : ''}`}>
                        <div className="bg-white border border-gray-100/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] rounded-xl overflow-hidden transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                          {/* Header (always visible) */}
                          <div
                            className="flex items-center justify-between p-4 md:p-5 cursor-pointer select-none group"
                            onClick={() => toggleDay(`day-${index}`)}
                          >
                            <div className="flex items-center gap-4">
                              {/* Calendar Mini Icon */}
                            <div className="shrink-0 w-[46px] border border-orange-200 rounded-lg overflow-hidden bg-white shadow-sm font-poppins mt-0.5">
                              <div className="flex justify-evenly -mb-1 mt-1 relative z-10">
                                <div className="w-0.5 h-2 rounded-full border border-gray-300 bg-white" />
                                <div className="w-0.5 h-2 rounded-full border border-gray-300 bg-white" />
                                <div className="w-0.5 h-2 rounded-full border border-gray-300 bg-white" />
                              </div>
                              <div className="flex items-center justify-center py-0.5 mt-0.5 border-b border-orange-100">
                                <span className="text-[8px] uppercase font-bold text-[#f27a3a] tracking-[0.2em]">Day</span>
                              </div>
                              <div className="flex items-center justify-center py-1 bg-white">
                                <span className="text-xl font-bold text-[#f27a3a] leading-none">{String(dayNum).padStart(2, '0')}</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-[13px] text-gray-400 font-medium">
                                {dayDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <h3 className="text-base md:text-[17px] font-bold text-slate-800 leading-snug truncate pr-4 group-hover:text-[#f27a3a] transition-colors">
                                {title}
                              </h3>
                            </div>
                          </div>

                          {/* Expand/Collapse Button */}
                          <div className={`shrink-0 w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${isExpanded ? 'border-slate-800 text-slate-800' : 'border-gray-300 text-gray-400 group-hover:border-gray-400'}`}>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </motion.div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 md:px-5 pb-5 border-t border-gray-100/80">
                                {/* Description */}
                                {description && (
                                  <p className="text-[14px] text-gray-500 leading-relaxed font-light mt-5 mb-5 space-y-2">
                                    {description}
                                  </p>
                                )}

                                {/* Day Images (if any) */}
                                {dayImages.length > 0 && (
                                  <div className="relative rounded-xl overflow-hidden h-40 md:h-56 mt-3 mb-5 border border-gray-100/80">
                                    <img
                                      src={dayImages[0]}
                                      alt={`Day ${dayNum}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}

                                {/* Example Transfer & Stay Sections mapped from package (Mocked/Interpolated for visual match) */}
                                <div className="mt-4 flex flex-col">
                                  {/* Transfer Row */}
                                  {(packageData.package_vehicles && packageData.package_vehicles.length > 0) && (
                                    <div className="border-t border-gray-100/80 py-4 flex items-center justify-between group cursor-pointer">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-gray-400 text-[13px] font-medium">
                                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 15v1c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
                                          Private Transfer:
                                        </div>
                                        <div className="text-[15px] font-semibold text-gray-800">
                                          Transfer In {typeof packageData.package_vehicles[0] === 'string' ? packageData.package_vehicles[0] : packageData.package_vehicles[0].vehicleType || 'SUV'}
                                        </div>
                                      </div>
                                      <ChevronDown className="w-4 h-4 text-gray-800" />
                                    </div>
                                  )}

                                  {/* Stay Row */}
                                  <div className="border-t border-gray-100/80 py-4 flex items-center justify-between group cursor-pointer">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1.5 text-gray-400 text-[13px] font-medium">
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
                                        Stay At:
                                      </div>
                                      <div className="text-[15px] font-semibold text-gray-800">
                                        Check-In At {destination} Hotel
                                      </div>
                                      <div className="text-[11px] text-gray-500 font-medium tracking-wide">
                                        Starts At: 3:00 PM | Duration: {dayNum === packageItineraries.length ? 1 : 2} Nights
                                      </div>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-800" />
                                  </div>
                                </div>

                                {/* Video Link */}
                                {videoUrl && (
                                  <a
                                    href={videoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-[#fff5ef] border border-orange-200 text-[#f27a3a] rounded-full text-sm font-semibold hover:bg-orange-50 transition-colors"
                                  >
                                    <Play className="w-4 h-4" />
                                    Watch Video
                                  </a>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column — Fare Breakup (sticky sidebar) */}
          <div className="w-full lg:w-[360px] shrink-0 lg:sticky lg:top-28 self-start">
            <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-lg">Fare Breakup</h3>
              </div>
              <div className="p-5 space-y-3.5">
                {/* Date & Travelers */}
                <div className="flex justify-between items-center text-xs font-semibold text-gray-700 border-b border-gray-100 pb-3.5">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    {adults} Adult{adults > 1 ? 's' : ''}
                  </span>
                </div>
                {/* Per Adult */}
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">Per Adult</span>
                  <span className="font-semibold text-gray-800">₹{adultPrice.toLocaleString()}</span>
                </div>
                {/* Children if any */}
                {(packageData.children || 0) > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-500">Per Child × {packageData.children}</span>
                    <span className="font-semibold text-gray-800">₹{(pricingData.childPrice || 0).toLocaleString()}</span>
                  </div>
                )}
                {/* TCS */}
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">TCS Tax @ {gstPercent}% ({gstPercent}.0%)</span>
                  <span className="font-semibold text-gray-800">₹{(totalPrice * gstPercent / 100).toLocaleString()}</span>
                </div>
                {/* GST */}
                <div className="flex justify-between text-[13px] border-b border-gray-100 pb-3.5">
                  <span className="text-gray-500">{gstPercent}% GST ({gstPercent}.0%)</span>
                  <span className="font-semibold text-gray-800">₹{(totalPrice * gstPercent / 100).toLocaleString()}</span>
                </div>
                {/* Trip Total */}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[15px] text-gray-600 font-semibold">Trip Total</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-gray-400 line-through">₹{Math.round(totalPrice * 1.15).toLocaleString()}</span>
                    <span className="text-[17px] font-bold text-gray-800">₹{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
