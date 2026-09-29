import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MovieDetail from "./pages/MovieDetail";
import TVDetail from "./pages/TVDetail";
import Search from "./pages/Search";
import Movies from "./pages/Movies";
import TV from "./pages/TV";
import Genres from "./pages/Genres";
import NotFound from "./pages/NotFound";
import RecommendationsPage from '@/pages/RecommendationsPage';
import TimeMachinePage from '@/pages/TimeMachinePage';
import SchedulePage from '@/pages/SchedulePage';
import ExplorePage from '@/pages/ExplorePage';
import LanguagesPage from '@/pages/LanguagesPage';
import CategoriesPage from '@/pages/CategoriesPage';
import CountriesPage from '@/pages/CountriesPage';
import { AuthProvider } from '@/contexts/AuthContext';
import { ScrollToTop } from '@/components/ScrollToTop';

// Optimized QueryClient configuration for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long data is considered fresh (no refetch needed)
      staleTime: 1000 * 60 * 5, // 5 minutes
      
      // How long unused data stays in cache before garbage collection
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime in v4)
      
      // Retry failed requests with exponential backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch behavior optimization
      refetchOnWindowFocus: false, // Don't refetch when user returns to tab
      refetchOnReconnect: true,    // Refetch when internet reconnects
      refetchOnMount: true,         // Refetch when component mounts if data is stale
      
      // Network mode
      networkMode: 'online', // Only run queries when online
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tv" element={<TV />} />
            <Route path="/genres" element={<Genres />} />
            <Route path="/search" element={<Search />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/tv/:id" element={<TVDetail />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/time-machine" element={<TimeMachinePage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/languages" element={<LanguagesPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/countries" element={<CountriesPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    
    {/* React Query DevTools - Only shows in development */}
    {import.meta.env.DEV && (
      <ReactQueryDevtools 
        initialIsOpen={false}
      />
    )}
  </QueryClientProvider>
);

export default App;