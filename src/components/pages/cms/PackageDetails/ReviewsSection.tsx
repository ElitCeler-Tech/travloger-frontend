import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MapPin, Star, ChevronLeft, ChevronRight } from 'lucide-react'

interface ReviewsSectionProps {
  packageData: any
}

// Fallback reviews if API has none
const FALLBACK_REVIEWS = [
  {
    name: "Manpreet",
    location: "India",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    rating: 5,
    text: "The Trek was well planned and well managed especially by our team leader Jyoti singh. I guess she is the best leader with all the leadership qualities because of her spirit we were able to go up to the summit. So many beautiful memories with this trek and of course with the best people. Thanks Traveloger for r"
  },
  {
    name: "Udita Purkayastha",
    location: "Vietnam",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    rating: 5,
    text: "Had an incredible experience with Traveloger. Their Support specialist (Vishal) was always available for any query or support. Traveloger's ground team was very punctual and ensured that everything mentioned in the itinerary was covered. All the hotels were fantastic in terms of amenities, cleanlines"
  },
  {
    name: "Aditi Jain",
    location: "India",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    rating: 5,
    text: "This was my first trip with Traveloger. We went on a 5D 6N trip to Trivandrum, Kovalam, Poovar and Kanyakumari. The trip was well organized. The condition of the cab was good. Driver was very sweet and could speak Hindi. Since it was the peak time of the New Year and we booked last minute. Overall, we l"
  },
  {
    name: "Sarah Parker",
    location: "UK",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    rating: 4,
    text: "The overall experience was amazing. The guides were extremely knowledgeable. We saw some breathtaking views. The only issue was the delay on day 2 due to bad weather, but the team handled it professionally and made up for the lost time later in the trip."
  }
]

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ packageData }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Use package reviews, fallback to predefined if empty
  const rawReviews = packageData?.reviews || []
  const reviews = rawReviews.length > 0 ? rawReviews : FALLBACK_REVIEWS

  // Badges data mocked to match image exactly
  const badges = [
    {
      platform: "Trustpilot",
      icon: (
        <div className="w-8 h-8 rounded-sm bg-[#00b67a] flex items-center justify-center text-white p-1 pb-1.5">
          <svg viewBox="0 0 512 512" fill="currentColor"><path d="M503.2 195.8l-159.2-2.4L294 38.6c-4.4-14.4-23.6-14-27.6.4l-48.4 154.8-158.8 2.8c-14.8.4-20.8 19.2-8.4 28l129.2 93.6-49.6 150.4c-4.4 14.4 11.6 25.6 23.2 16.8L256 388.4l138.8 100.8c11.6 8.4 27.6-2.4 22.8-16.8l-50.4-150.4 128.4-94.4c12-8.4 6-27.2-8.8-27.6zM250 348l-102.8 74.8 38.8-118-100-72.8 123.6-2L250 114v234z" fill="white"/></svg>
        </div>
      ),
      rating: "4.9",
      subtext: "23k+ reviews"
    },
    {
      platform: "Tripadvisor",
      icon: (
        <div className="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 512 512" className="w-8 h-8 text-[#34e0a1]"><circle cx="256" cy="256" r="256" fill="#000"/><path d="M375.3 162.7c-9.5-3.3-20.2-3.1-29.3.9l-38.6 16.8-27.5-62c-3.1-7.1-10.2-11.7-18-11.7s-14.8 4.6-18 11.7l-27.5 62-38.6-16.8c-9.1-4-19.8-4.2-29.3-.9-9.5 3.3-17.1 10.5-20.8 19.8-3.7 9.3-3.2 19.8 1.4 28.7l23.5 45.3c-23.4 17.5-39 44.9-39 76 0 53.6 43.6 97.2 97.2 97.2s97.2-43.6 97.2-97.2c0-8.8-1.2-17.4-3.4-25.5-3.1-11.4-8-22.1-14.5-31.5l22.6-43.5c4.6-8.9 5.1-19.4 1.4-28.7-3.7-9.3-11.3-16.5-20.8-19.8zM211.5 351c-21.7 0-39.3-17.6-39.3-39.3 0-21.7 17.6-39.3 39.3-39.3 21.7 0 39.3 17.6 39.3 39.3.1 21.7-17.5 39.3-39.3 39.3z" fill="#34e0a1"/><path d="M300.5 351c-21.7 0-39.3-17.6-39.3-39.3 0-21.7 17.6-39.3 39.3-39.3 21.7 0 39.3 17.6 39.3 39.3 0 21.7-17.6 39.3-39.3 39.3zM256 261c-27.4 0-49.7 22.3-49.7 49.7S228.6 360.4 256 360.4s49.7-22.3 49.7-49.7S283.4 261 256 261z" fill="#34e0a1"/><circle cx="211.5" cy="311.7" r="14.3" fill="#000"/><circle cx="300.5" cy="311.7" r="14.3" fill="#000"/><path d="M256 267.3c-24.5 0-44.4 19.9-44.4 44.4s19.9 44.4 44.4 44.4 44.4-19.9 44.4-44.4-19.9-44.4-44.4-44.4zm0 78.5c-18.8 0-34.1-15.3-34.1-34.1 0-18.8 15.3-34.1 34.1-34.1 18.8 0 34.1 15.3 34.1 34.1 0 18.8-15.3 34.1-34.1 34.1z" fill="#000"/></svg>
        </div>
      ),
      rating: "4.2",
      subtext: "40k+ reviews"
    },
    {
      platform: "Google",
      icon: (
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 border border-gray-100 shadow-sm">
          <svg viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        </div>
      ),
      rating: "4.5",
      subtext: "70k+ reviews"
    }
  ]

  const itemsPerPage = 3
  const totalPages = Math.ceil(reviews.length / itemsPerPage)

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(totalPages - 1, prev + 1))
  }

  // Calculate visible range for sliding logic natively
  // But to look EXACTLY like image, the cards simply change based on index
  const visibleReviews = reviews.slice(
    currentIndex * itemsPerPage,
    currentIndex * itemsPerPage + itemsPerPage
  )

  return (
    <div className="w-full bg-white py-16 md:py-24" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Dancing+Script:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');
        .font-bebas { font-family: 'Bebas Neue', sans-serif; }
        .font-northwell { font-family: 'Dancing Script', cursive; font-style: italic; }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center relative mb-16">
          <div className="relative text-center w-full flex flex-col items-center">
             {/* "Praise" Text */}
             <div className="relative z-10 w-full max-w-4xl mx-auto flex justify-start pl-8 md:pl-0">
               <h2 
                 className="text-[#f27a3a] font-northwell text-6xl md:text-[90px] absolute -top-12 md:-top-16 md:-ml-8 z-20"
                 style={{ transform: 'rotate(-4deg)' }}
               >
                 Praise
               </h2>
             </div>
             
             {/* "FROM EVERY CORNER" Text */}
             <div className="w-full max-w-4xl mx-auto flex justify-start">
              <h1 className="text-gray-300 font-bebas text-6xl md:text-[100px] leading-none tracking-wide relative z-10">
                FROM EVERY CORNER
              </h1>
             </div>
          </div>

          {/* Review Badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 mb-8">
            {badges.map((badge, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-6 bg-white rounded-full px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-50 min-w-[260px] md:min-w-[280px]"
              >
                <div className="flex flex-col items-center min-w-[60px]">
                  {badge.icon}
                  <span className="text-[11px] font-bold text-gray-800 tracking-wide mt-1.5">{badge.platform}</span>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-gray-800 leading-tight block">{badge.rating}</span>
                  <span className="text-sm text-gray-400 font-medium block whitespace-nowrap">{badge.subtext}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Section */}
        <div className="relative w-full px-6 md:px-12 py-4">
          
          {/* Previous Arrow */}
          <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center transition-all ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 text-gray-800 cursor-pointer'}`}
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          {/* Cards Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {visibleReviews.map((review: any, idx: number) => (
                <motion.div
                  key={`${currentIndex}-${idx}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100/50 flex flex-col min-h-[280px]"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-100">
                        <img 
                          src={review.image || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop"} 
                          alt={review.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-semibold text-gray-800 text-[16px]">{review.name}</h3>
                        <div className="flex items-center text-gray-400 text-sm gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{review.location || 'India'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating divider line */}
                  <div className="w-full h-px bg-gray-100/80 mb-4" />

                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, starIdx) => (
                      <Star 
                        key={starIdx} 
                        className={`w-4 h-4 ${starIdx < (review.rating || 5) ? 'fill-[#ffc107] text-[#ffc107]' : 'fill-gray-200 text-gray-200'}`} 
                      />
                    ))}
                  </div>

                  {/* Review Text */}
                  <div className="text-[14px] leading-[1.6] text-gray-500 font-light flex-1">
                    <p className="line-clamp-6 relative">
                      {review.text}
                      {review.text.length > 150 && (
                        <span className="font-bold text-gray-800 ml-1 cursor-pointer hover:underline">
                          ...Read More
                        </span>
                      )}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Next Arrow */}
          <button 
            onClick={handleNext}
            disabled={currentIndex === totalPages - 1 || totalPages === 0}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center transition-all ${currentIndex === totalPages - 1 || totalPages === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 text-gray-800 cursor-pointer'}`}
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Pagination Dots */}
        {totalPages > 0 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <div 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer
                  ${idx === currentIndex 
                    ? 'w-10 py-[3px] bg-gray-200 text-[10px] font-bold text-gray-600 text-center leading-none flex items-center justify-center' 
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                  }
                `}
              >
                {idx === currentIndex ? `${currentIndex + 1}/${totalPages}` : ''}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
