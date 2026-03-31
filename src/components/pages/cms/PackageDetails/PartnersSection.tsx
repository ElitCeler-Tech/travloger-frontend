import React from 'react'
import { motion } from 'motion/react'

interface PartnersSectionProps {
  packageData: any
}

// Fallback partners with transparent logos to mock the exact layout
const FALLBACK_PARTNERS = [
  { name: "Bali Safari", logo: "https://logo.clearbit.com/booking.com" },
  { name: "Bali Zoo", logo: "https://logo.clearbit.com/expedia.com" },
  { name: "Bali Bird", logo: "https://logo.clearbit.com/airbnb.com" },
  { name: "Amanzi", logo: "https://logo.clearbit.com/marriott.com" },
  { name: "Finns", logo: "https://logo.clearbit.com/hilton.com" },
  { name: "Merusaka", logo: "https://logo.clearbit.com/hyatt.com" },
  { name: "The Payogan", logo: "https://logo.clearbit.com/emirates.com" },
  { name: "Amaroossa", logo: "https://logo.clearbit.com/qatarairways.com" },
  { name: "Samsara", logo: "https://logo.clearbit.com/agoda.com" },
  { name: "Grand", logo: "https://logo.clearbit.com/tripadvisor.com" },
  { name: "Casa Bonita", logo: "https://logo.clearbit.com/kayak.com" },
  { name: "Talisman", logo: "https://logo.clearbit.com/skyscanner.com" },
  { name: "TIS Villas", logo: "https://logo.clearbit.com/uber.com" },
  { name: "Swarga", logo: "https://logo.clearbit.com/grab.com" }
]

export const PartnersSection: React.FC<PartnersSectionProps> = ({ packageData }) => {
  // Use package partners, fallback to predefined if empty
  const rawPartners = packageData?.our_partners || []
  const partners = rawPartners.length > 0 ? rawPartners : FALLBACK_PARTNERS

  return (
    <div className="w-full bg-white py-16 md:py-24" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Dancing+Script:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');
        .font-bebas { font-family: 'Bebas Neue', sans-serif; }
        .font-northwell { font-family: 'Dancing Script', cursive; font-style: italic; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center relative mb-16 md:mb-20">
          <div className="relative text-center w-full flex flex-col items-center">
             {/* "Our" Text */}
             <div className="relative z-10 w-full flex justify-center">
               <h2 
                 className="text-[#f27a3a] font-northwell text-6xl md:text-[85px] absolute -top-12 md:-top-16 z-20"
                 style={{ transform: 'rotate(-4deg)' }}
               >
                 Our
               </h2>
             </div>
             
             {/* "PARTNERS" Text */}
             <div className="relative z-10">
              <h1 className="text-gray-300 font-bebas text-6xl md:text-[90px] leading-none tracking-wide">
                PARTNERS
              </h1>
             </div>
          </div>
        </div>

        {/* Partners Grid */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {partners.map((partner: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="w-[120px] h-[90px] md:w-[150px] md:h-[110px] bg-[#f8f9fa] rounded-2xl flex items-center justify-center p-4 md:p-6 transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-gray-100 group"
            >
              <img
                src={partner.logo}
                alt={partner.name || `Partner ${idx + 1}`}
                className="max-w-full max-h-[70px] object-contain mix-blend-multiply"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
