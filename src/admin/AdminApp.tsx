import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AdminToaster } from "@/admin/ui";

// Admin components
import { AdminRouteWrapper } from "@/admin/components/AdminRouteWrapper";
import { AdminProtectedRoute } from "@/admin/components/AdminProtectedRoute";

// Admin Pages - DIRECT IMPORTS to avoid Barrel Crash
import AdminAuth from "@/admin/pages/AdminAuth";
import AdminDashboard from "@/admin/pages/AdminDashboard";
import AdminAnalytics from "@/admin/pages/AdminAnalytics";
import AdminUsers from "@/admin/pages/AdminUsers";
import AdminUsage from "@/admin/pages/AdminUsage";
import AdminConfig from "@/admin/pages/AdminConfig";
import AdminBilling from "@/admin/pages/AdminBilling";
import AdminEmail from "@/admin/pages/AdminEmail";
import AdminEmailLogs from "@/admin/pages/AdminEmailLogs";
import AdminEmailTesting from "@/admin/pages/AdminEmailTesting";
import AdminPrompts from "@/admin/pages/AdminPrompts";
import AdminFiles from "@/admin/pages/AdminFiles";
import AdminSpaces from "@/admin/pages/AdminSpaces";
import AdminPersonas from "@/admin/pages/AdminPersonas";
import AdminBlank from "@/admin/pages/AdminBlank";

import AdminMaintenance from "@/admin/pages/AdminMaintenance";
import AdminFunctions from "@/admin/pages/AdminFunctions";
import AdminSystemHealth from "@/admin/pages/AdminSystemHealth";
import AdminAiStyleGuides from "@/admin/pages/AdminAiStyleGuides";
import AdminOpenRouter from "@/admin/pages/AdminOpenRouter";
import AdminSupabase from "@/admin/pages/AdminSupabase";
// } from "@/admin/pages";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000,
        },
    },
});

export function AdminApp() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                <BrowserRouter basename="/admin">
                    <Routes>
                        <Route path="/" element={<AdminRouteWrapper />}>
                            <Route index element={<AdminAuth />} />
                            {/* Protected Dashboard Route - Enabled for testing after login */}
                            <Route path="dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                            <Route path="analytics" element={<AdminProtectedRoute><AdminAnalytics /></AdminProtectedRoute>} />
                            <Route path="users" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
                            <Route path="usage" element={<AdminProtectedRoute><AdminUsage /></AdminProtectedRoute>} />
                            <Route path="config" element={<AdminProtectedRoute><AdminConfig /></AdminProtectedRoute>} />
                            <Route path="billing" element={<AdminProtectedRoute><AdminBilling /></AdminProtectedRoute>} />
                            <Route path="email" element={<AdminProtectedRoute><AdminEmail /></AdminProtectedRoute>} />
                            <Route path="email-logs" element={<AdminProtectedRoute><AdminEmailLogs /></AdminProtectedRoute>} />
                            <Route path="email-testing" element={<AdminProtectedRoute><AdminEmailTesting /></AdminProtectedRoute>} />
                            <Route path="prompts" element={<AdminProtectedRoute><AdminPrompts /></AdminProtectedRoute>} />
                            <Route path="files" element={<AdminProtectedRoute><AdminFiles /></AdminProtectedRoute>} />
                            <Route path="spaces" element={<AdminProtectedRoute><AdminSpaces /></AdminProtectedRoute>} />
                            <Route path="personas" element={<AdminProtectedRoute><AdminPersonas /></AdminProtectedRoute>} />

                            <Route path="maintenance" element={<AdminProtectedRoute><AdminMaintenance /></AdminProtectedRoute>} />
                            <Route path="functions" element={<AdminProtectedRoute><AdminFunctions /></AdminProtectedRoute>} />
                            <Route path="ai-style-guides" element={<AdminProtectedRoute><AdminAiStyleGuides /></AdminProtectedRoute>} />
                            <Route path="openrouter" element={<AdminProtectedRoute><AdminOpenRouter /></AdminProtectedRoute>} />
                            <Route path="system-health" element={<AdminProtectedRoute><AdminSystemHealth /></AdminProtectedRoute>} />
                            <Route path="supabase" element={<AdminProtectedRoute><AdminSupabase /></AdminProtectedRoute>} />
                            <Route path="blank" element={<AdminProtectedRoute><AdminBlank /></AdminProtectedRoute>} />
                        </Route>

                        {/* 404 for admin routes */}
                        <Route path="*" element={<div className="p-10 text-center">Admin 404: Page Not Found</div>} />
                    </Routes>
                </BrowserRouter>
                <AdminToaster />
            </ThemeProvider>
        </QueryClientProvider>
    );
}
