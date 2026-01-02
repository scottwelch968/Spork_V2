import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import { AuthCallback } from "@/components/auth/AuthCallback";
import { UserRouteLayout } from "@/components/auth/UserRouteLayout";
import RootRedirect from "@/components/auth/RootRedirect";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Files from "./pages/Files";
import KnowledgeBase from "./pages/KnowledgeBase";
import Spaces from "./pages/Spaces";
import SpaceView from "./pages/SpaceView";
import AcceptInvite from "./pages/AcceptInvite";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";
import Chat from "./pages/Chat";
import Discover from "./pages/Discover";
import Activity from "./pages/Activity";

import TabsDemo from './pages/TabsDemo';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes cache
      refetchOnWindowFocus: false, // Prevent refetch on tab switch
      refetchOnReconnect: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* All user routes share a single AuthProvider/ChatProvider via layout */}
              <Route element={<UserRouteLayout />}>
                {/* Public Routes (still under layout for consistent context) */}
                <Route path="/" element={<RootRedirect />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/tabs-demo" element={<TabsDemo />} />

                {/* User Protected Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
                <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
                <Route path="/files" element={<ProtectedRoute><Files /></ProtectedRoute>} />
                <Route path="/knowledge-base" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                <Route path="/workspace" element={<ProtectedRoute><Spaces /></ProtectedRoute>} />
                <Route path="/workspace/:id" element={<ProtectedRoute><SpaceView /></ProtectedRoute>} />
                <Route path="/invite/:token" element={<ProtectedRoute><AcceptInvite /></ProtectedRoute>} />

              </Route>
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
