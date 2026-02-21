import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import AllSites from "./pages/AllSites";
import ComparisonPage from "./pages/ComparisonPage";
import HighRiskAreas from "./pages/HighRiskAreas";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Login, { getSession } from "./pages/Login";
import MapView from "./pages/MapView";
import MiningSites from "./pages/MiningSites";
import Monitoring from "./pages/Monitoring";
import NotFound from "./pages/NotFound";
import NotificationsPage from "./pages/NotificationsPage";
import Statistics from "./pages/Statistics";
import ThreeDModel from "./pages/ThreeDModel";
import UploadDetection from "./pages/UploadDetection";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
            <Route path="/dashboard" element={<Index />} />
            <Route path="/upload" element={<UploadDetection />} />
            <Route path="/sites" element={<AllSites />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/mining-sites" element={<MiningSites />} />
            <Route path="/high-risk" element={<HighRiskAreas />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/comparison" element={<ComparisonPage />} />
          </Route>
          <Route path="/map" element={<MapView />} />
          <Route path="/3d-model" element={<ThreeDModel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
