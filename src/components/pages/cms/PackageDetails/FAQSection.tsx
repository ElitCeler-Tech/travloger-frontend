import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Minus } from 'lucide-react'

interface FAQSectionProps {
  packageData: any
}

// Fallback FAQs if API has none
const FALLBACK_FAQS = [
  {
    question: "What should I do if I'm having trouble with the payment?",
    answer: "If you're experiencing payment issues, our dedicated destination expert is here to assist you. Please reach out to them, and they'll guide you through the resolution process and help ensure your payment goes smoothly."
  },
  {
    question: "Can I personalize the itinerary by adding or removing activities, stays, or transfers?",
    answer: "Yes, our itineraries are fully customizable. You can work with your destination expert to add or remove specific activities, upgrade your stays, or change your transfer preferences to suit your needs."
  },
  {
    question: "What options do I have if the quotation expires?",
    answer: "If your quotation expires, simply contact your dedicated travel expert. They can refresh the quote based on current availability and pricing to provide you with an updated itinerary."
  }
]

export const FAQSection: React.FC<FAQSectionProps> = ({ packageData }) => {
  const [openIndex, setOpenIndex] = useState<number>(0) // Open first by default to match image

  // Use package faqs, fallback to predefined if empty
  const rawFaqs = packageData?.faqs || []
  const faqs = rawFaqs.length > 0 ? rawFaqs : FALLBACK_FAQS

  const toggleFaq = (index: number) => {
    setOpenIndex(prev => (prev === index ? -1 : index))
  }

  return (
    <div className="w-full bg-white py-16 md:py-24" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Dancing+Script:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');
        .font-bebas { font-family: 'Bebas Neue', sans-serif; }
        .font-northwell { font-family: 'Dancing Script', cursive; font-style: italic; }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Header Section */}
        <div className="flex flex-col mb-16 relative">
          <div className="relative w-full flex flex-col items-start pl-4 md:pl-8">
             {/* "Frequently" Text */}
             <div className="relative z-10">
               <h2 
                 className="text-[#f27a3a] font-northwell text-6xl md:text-[85px] absolute -top-12 md:-top-16 -ml-4 z-20"
                 style={{ transform: 'rotate(-4deg)' }}
               >
                 Frequently
               </h2>
             </div>
             
             {/* "ASKED QUESTIONS" Text */}
             <div className="relative z-10 pb-6">
              <h1 className="text-gray-300 font-bebas text-6xl md:text-[90px] leading-none tracking-wide text-left">
                ASKED QUESTIONS
              </h1>
             </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pl-4 md:pl-8">
          {faqs.map((faq: any, idx: number) => {
            const isOpen = openIndex === idx

            return (
              <div key={idx} className="flex flex-col border-b border-transparent">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="flex items-start gap-4 md:gap-6 text-left focus:outline-none group pb-2"
                >
                  <div className="mt-1 md:mt-0.5 shrink-0 text-[#f27a3a]">
                    {isOpen ? (
                      <Minus strokeWidth={1.5} className="w-6 h-6 md:w-8 md:h-8" />
                    ) : (
                      <Plus strokeWidth={1.5} className="w-6 h-6 md:w-8 md:h-8" />
                    )}
                  </div>
                  <div className="flex flex-col w-full">
                    <h3 className="text-[17px] md:text-[19px] text-gray-800 font-medium leading-[1.4] transition-colors group-hover:text-[#f27a3a]">
                      {faq.question}
                    </h3>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pl-10 md:pl-14 pb-6 pt-2">
                        <p className="text-[15px] leading-[1.7] text-gray-500 font-light">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
