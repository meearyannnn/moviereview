// src/components/GoldenAestheticBackground.tsx — Luxury Golden Cinema Aura Background
import React from 'react';

export const GoldenAestheticBackground: React.FC = () => {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* ── 1. Top Cinema Projector Beam / Golden Crown ── */}
      <div
        className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-[140vw] max-w-[1500px] h-[650px] opacity-90 transition-opacity duration-1000"
        style={{
          background:
            'radial-gradient(ellipse 65% 55% at 50% 0%, rgba(245, 197, 66, 0.16) 0%, rgba(201, 162, 75, 0.08) 35%, rgba(212, 160, 23, 0.02) 65%, transparent 80%)',
          filter: 'blur(30px)',
        }}
      />

      {/* ── 2. Top Shimmer Horizon Line ── */}
      <div
        className="absolute top-0 left-0 right-0 h-[1.5px] opacity-75"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(245, 197, 66, 0.1) 15%, rgba(255, 225, 130, 0.6) 50%, rgba(245, 197, 66, 0.1) 85%, transparent 100%)',
          boxShadow: '0 0 15px rgba(245, 197, 66, 0.4)',
        }}
      />

      {/* ── 3. Ambient Golden Flare (Top-Right Depth) ── */}
      <div
        className="absolute top-[8%] -right-[120px] w-[550px] h-[550px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(245, 197, 66, 0.09) 0%, rgba(201, 162, 75, 0.04) 40%, transparent 75%)',
          filter: 'blur(45px)',
        }}
      />

      {/* ── 4. Ambient Golden Flare (Mid-Left Warmth) ── */}
      <div
        className="absolute top-[38%] -left-[160px] w-[620px] h-[620px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(212, 160, 23, 0.07) 0%, rgba(201, 162, 75, 0.03) 45%, transparent 75%)',
          filter: 'blur(55px)',
        }}
      />

      {/* ── 5. Ambient Golden Flare (Lower-Right Atmosphere) ── */}
      <div
        className="absolute top-[68%] -right-[140px] w-[600px] h-[600px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(245, 197, 66, 0.06) 0%, rgba(201, 162, 75, 0.02) 40%, transparent 75%)',
          filter: 'blur(50px)',
        }}
      />

      {/* ── 6. Subtle Center Screen Vignette Warmth ── */}
      <div
        className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[90vw] max-w-[1200px] h-[800px] opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(245, 197, 66, 0.05) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
    </div>
  );
};
