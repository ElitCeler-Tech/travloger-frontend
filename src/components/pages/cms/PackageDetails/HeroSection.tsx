import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeroSectionProps {
  packageData: any;
  heroImages?: string[];
}

// Fallback images for when no real images are available
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1920",
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  packageData,
  heroImages = [],
}) => {
  const images = heroImages.length > 0 ? heroImages : FALLBACK_IMAGES;
  const [currentIndex, setCurrentIndex] = useState(0);

  const title = packageData?.name || 'Package';
  const numDays = packageData?.num_days || 0;
  const numNights = packageData?.num_nights || 0;
  const duration = `${numDays} Days | ${numNights} Nights`;
  const partnerName = packageData?.partner_name || '';

  // Auto scroll effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  // Split title for styling: first word gets Northwell, rest gets Bebas Neue
  const words = title.split(' ');
  const firstWord = words[0] || '';
  const restWords = words.slice(1).join(' ');

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Dancing+Script:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');
        .font-bebas { font-family: 'Bebas Neue', sans-serif; }
        .font-northwell { font-family: 'Dancing Script', cursive; font-style: italic; }
      `}</style>

      {/* Background Images Carousel */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          alt="Hero Background"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </AnimatePresence>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      {/* Top Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6 text-white bg-linear-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2 cursor-pointer">
          <span className="text-2xl font-bold tracking-tighter">traveloger</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          {partnerName && (
            <span className="text-white/80 text-xs hidden md:block">by {partnerName}</span>
          )}
          <select className="bg-transparent border-none text-white cursor-pointer outline-none font-semibold">
            <option className="text-black">USD</option>
            <option className="text-black">INR</option>
            <option className="text-black">EUR</option>
          </select>
          <div className="flex items-center gap-2 cursor-pointer hover:text-white/80 transition-colors">
            <User size={18} />
            <span>Login</span>
          </div>
        </div>
      </header>

      {/* Left Quotation Banner */}
      <div className="absolute top-32 left-8 z-20 flex items-center gap-4 group">
        <a href="#" className="flex items-center bg-black/40 backdrop-blur-md rounded-full pr-6 py-2 border border-white/20 transition-all hover:bg-black/60 cursor-pointer">
          <div className="w-10 h-10 ml-2 bg-orange-500 rounded-full flex items-center justify-center text-white mr-3 shrink-0">
             <svg viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5"><path d="M6.0026 6.57491C5.86927 6.57491 5.74427 6.55425 5.6276 6.51291C5.51093 6.47158 5.4026 6.40058 5.3026 6.29991L0.7026 1.69991C0.519267 1.51658 0.423267 1.28725 0.414601 1.01191C0.405934 0.736581 0.501934 0.499248 0.7026 0.299914C0.885934 0.116581 1.11927 0.0249143 1.4026 0.0249143C1.68593 0.0249143 1.91927 0.116581 2.1026 0.299914L6.0026 4.17491L9.9026 0.299914C10.0859 0.116581 10.3153 0.0209142 10.5906 0.0129142C10.8659 0.00491419 11.1033 0.100581 11.3026 0.299914C11.4859 0.483248 11.5776 0.716581 11.5776 0.999914C11.5776 1.28325 11.4859 1.51658 11.3026 1.69991L6.7026 6.29991C6.6026 6.39991 6.49427 6.47091 6.3776 6.51291C6.26093 6.55491 6.13593 6.57558 6.0026 6.57491ZM6.0026 12.5749C5.86927 12.5749 5.74427 12.5542 5.6276 12.5129C5.51093 12.4716 5.4026 12.4006 5.3026 12.2999L0.7026 7.69991C0.519267 7.51658 0.423267 7.28758 0.414601 7.01291C0.405934 6.73825 0.501934 6.50058 0.7026 6.29991C0.885934 6.11658 1.11927 6.02491 1.4026 6.02491C1.68593 6.02491 1.91927 6.11658 2.1026 6.29991L6.0026 10.1749L9.9026 6.29991C10.0859 6.11658 10.3153 6.02058 10.5906 6.01191C10.8659 6.00325 11.1033 6.09925 11.3026 6.29991C11.4859 6.48325 11.5776 6.71658 11.5776 6.99991C11.5776 7.28325 11.4859 7.51658 11.3026 7.69991L6.7026 12.2999C6.6026 12.3999 6.49427 12.4709 6.3776 12.5129C6.26093 12.5549 6.13593 12.5756 6.0026 12.5749Z" fill="white"></path></svg>
          </div>
          <div className="flex flex-col text-white">
            <span className="text-sm font-bold tracking-wide">1+ Quotation Options</span>
            <span className="text-xs text-white/70">View All</span>
          </div>
        </a>
      </div>

      {/* Main Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 px-4">
        <motion.div
          className="relative flex flex-col items-center justify-center mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {firstWord && (
            <h2 className="absolute -top-16 md:-top-24 left-1/2 -translate-x-[80%] text-6xl md:text-8xl text-[#FFD700] drop-shadow-md z-20 font-northwell font-light italic tracking-wider"
                style={{ transform: 'translateX(-90%) rotate(-5deg)' }}>
              {firstWord}
            </h2>
          )}

          <div className="flex items-end gap-3 md:gap-6 z-10">
            {restWords ? (
              <>
                <h1 className="text-8xl md:text-[180px] text-white leading-none tracking-normal drop-shadow-2xl font-bebas">
                  {restWords}
                </h1>
                <h1 className="text-5xl md:text-[90px] text-white leading-none tracking-normal drop-shadow-2xl font-bebas pb-2 md:pb-6">
                  TRIP
                </h1>
              </>
            ) : (
              <h1 className="text-8xl md:text-[180px] text-white leading-none tracking-normal drop-shadow-2xl font-bebas">
                {firstWord}
              </h1>
            )}
          </div>

          <div className="flex items-center justify-center mt-2 group z-20">
            <div className="text-sm md:text-xl font-bold text-white tracking-widest px-4 py-1.5 drop-shadow-md border-y border-white/40 font-bebas">
              {duration}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Carousel Navigation Arrows */}
      <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
        <button
          onClick={handlePrevious}
          className="pointer-events-auto w-12 h-12 rounded-full border border-white/40 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/20 hover:border-white transition-all backdrop-blur-sm"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={handleNext}
          className="pointer-events-auto w-12 h-12 rounded-full border border-white/40 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/20 hover:border-white transition-all backdrop-blur-sm"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Bottom Carousel Indicators */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-20">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full ${
              idx === currentIndex
                ? 'w-8 h-2.5 bg-white'
                : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
