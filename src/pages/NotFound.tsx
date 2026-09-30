import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Film, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: Non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-[#0a0608] text-white flex flex-col items-center justify-center p-4 selection:bg-[#c9a24b] selection:text-[#1c120c] overflow-hidden">
      {/* Projector light ambient radial glow */}
      <div 
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 90% 55% at 50% 0%, rgba(245, 197, 66, 0.08) 0%, rgba(20, 10, 13, 0.4) 55%, transparent 80%)'
        }}
      />
      <div className="pointer-events-none fixed inset-y-0 left-0 w-24 bg-gradient-to-r from-black/80 to-transparent z-10" />
      <div className="pointer-events-none fixed inset-y-0 right-0 w-24 bg-gradient-to-l from-black/80 to-transparent z-10" />

      <Navbar />

      <div className="relative z-20 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-2xl bg-[#140a0d] border border-[#c9a24b]/25 flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Film className="w-10 h-10 text-[#f5c542] animate-pulse" />
        </div>

        <h1 className="font-display font-black text-7xl text-white tracking-tight mb-2">
          4<span className="text-[#f5c542]">0</span>4
        </h1>

        <h2 className="font-display font-bold text-xl text-white mb-2">
          Lost in the Theater
        </h2>

        <p className="text-sm text-white/50 mb-8 font-light">
          The scene or title you're looking for doesn't exist or has been moved to another theater.
        </p>

        <Link to="/" className="btn-cinema-gold">
          <Home className="w-4 h-4 text-[#1c120c] fill-[#1c120c]" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;