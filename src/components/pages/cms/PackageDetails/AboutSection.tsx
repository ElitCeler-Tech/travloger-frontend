import React from "react";
import { motion } from "motion/react";

interface AboutSectionProps {
  packageData: any;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ packageData }) => {
  const summaryText =
    packageData?.summary_text || packageData?.short_description || "";
  const summaryHighlights = packageData?.summary_highlights || [];
  const visionAbout = packageData?.vision_about || {};
  const summaryImage = packageData?.summary_image || "";
  const partnerName = packageData?.partner_name || "Traveloger";

  return (
    <div
      className="relative py-28 bg-[#2d3032] text-white min-h-[70vh] flex items-center w-full"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Dancing+Script:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');
        .font-bebas { font-family: 'Bebas Neue', sans-serif; }
        .font-northwell { font-family: 'Dancing Script', cursive; font-style: italic; }
      `}</style>
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <img
          src={
            summaryImage ||
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920"
          }
          alt="About Background"
          className="w-full h-full object-cover object-center opacity-30 scale-105"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-[#2d3032] via-[#2d3032]/40 to-transparent" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col justify-center">
        <div className="w-full lg:w-[55%] flex flex-col gap-8 md:gap-12">
          {/* Headings */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col relative w-fit"
          >
            <h2
              className="text-6xl md:text-8xl font-light italic text-[#f27a3a] drop-shadow-md z-20 font-northwell absolute -top-14 md:-top-20 left-4 md:left-8 tracking-wider"
              style={{ transform: "rotate(-5deg)" }}
            >
              We are all
            </h2>
            <h1 className="text-6xl md:text-8xl lg:text-[110px] font-bebas text-white tracking-wide leading-none drop-shadow-xl z-10 mt-6 md:mt-10">
              TRAVELOGER
            </h1>
          </motion.div>

          {/* Summary Text */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="space-y-6 text-white/90 text-base md:text-lg font-light leading-relaxed tracking-wide"
          >
            {summaryText ? (
              <p>{summaryText}</p>
            ) : (
              <p>
                Traveloger passionately crafts exceptional travel experiences,
                serving{" "}
                <strong className="text-[#f27a3a] font-semibold">
                  ten million customers
                </strong>{" "}
                as India's leading online platform for booking travel
                experiences in{" "}
                <strong className="text-[#f27a3a] font-semibold">
                  55+ countries.
                </strong>
              </p>
            )}

            {visionAbout?.description && <p>{visionAbout.description}</p>}

            {/* Summary Highlights */}
            {summaryHighlights.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {summaryHighlights.map((highlight: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium"
                  >
                    <svg
                      className="w-4 h-4 text-[#f27a3a]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {highlight}
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Partner Attribution */}
          {partnerName && partnerName !== "Traveloger" && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-3 mt-4"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                {packageData?.partner_profile_photo ? (
                  <img
                    src={packageData.partner_profile_photo}
                    alt={partnerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {partnerName.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs text-white/60">Curated by</p>
                <p className="text-sm font-semibold text-white">
                  {partnerName}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
