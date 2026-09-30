import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from 'react';
import Home from "./pages/Home";
import { AuthProvider } from '@/contexts/AuthContext';
import { ScrollToTop } from '@/components/ScrollToTop';
import { RouteTransitionLoader } from '@/components/RouteTransitionLoader';
import { TicketLoader } from '@/components/TicketLoader';

const MovieDetail = lazy(() => import("./pages/MovieDetail"));
const TVDetail = lazy(() => import("./pages/TVDetail"));
const Search = lazy(() => import("./pages/Search"));
const Genres = lazy(() => import("./pages/Genres"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const DirectorsPage = lazy(() => import("./pages/DirectorsPage"));
const DirectorDetailPage = lazy(() => import("./pages/DirectorDetailPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const DiscussionsPage = lazy(() => import("./pages/community/DiscussionsPage"));
const ReviewsPage = lazy(() => import("./pages/community/ReviewsPage"));
const CollectionsPage = lazy(() => import("./pages/community/CollectionsPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const TimeMachinePage = lazy(() => import("./pages/TimeMachinePage"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));
const LanguagesPage = lazy(() => import("./pages/LanguagesPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const CountriesPage = lazy(() => import("./pages/CountriesPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
          <RouteTransitionLoader />
          <Suspense fallback={<TicketLoader fullScreen size="lg" label="Preparing cinema presentation…" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/movies" element={<Navigate to="/explore?type=movie" replace />} />
              <Route path="/tv" element={<Navigate to="/explore?type=tv" replace />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/genres" element={<Genres />} />
              <Route path="/directors" element={<DirectorsPage />} />
              <Route path="/director/:id" element={<DirectorDetailPage />} />
              <Route path="/search" element={<Search />} />
              <Route path="/movie/:id" element={<MovieDetail />} />
              <Route path="/tv/:id" element={<TVDetail />} />
              <Route path="/recommendations" element={<Navigate to="/" replace />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/community/discussions" element={<DiscussionsPage />} />
              <Route path="/community/reviews" element={<ReviewsPage />} />
              <Route path="/community/collections" element={<CollectionsPage />} />
              <Route path="/community/user/:userId" element={<UserProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/time-machine" element={<TimeMachinePage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/languages" element={<LanguagesPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/countries" element={<CountriesPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
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