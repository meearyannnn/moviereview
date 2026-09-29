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
    <div className="min-h-screen bg-[#060810] text-white flex flex-col items-center justify-center p-4 selection:bg-red-600 selection:text-white">
      <Navbar />

      <div className="text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Film className="w-10 h-10 text-red-500 animate-pulse" />
        </div>

        <h1 className="font-display font-extrabold text-7xl text-white tracking-tight mb-2">
          4<span className="text-red-500">0</span>4
        </h1>

        <h2 className="font-display font-bold text-xl text-white mb-2">
          Lost in the Theater
        </h2>

        <p className="text-sm text-white/50 mb-8 font-light">
          The scene or title you're looking for doesn't exist or has been moved to another theater.
        </p>

        <Link to="/" className="btn-cinema-gold">
          <Home className="w-4 h-4 text-black fill-black" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;