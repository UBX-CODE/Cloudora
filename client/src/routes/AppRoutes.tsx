import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { AppLayout } from '../components/layout/AppLayout';

// Pages
import { LandingPage } from '../pages/Landing/LandingPage';
import { LoginPage } from '../pages/Auth/LoginPage';
import { RegisterPage } from '../pages/Auth/RegisterPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { FilesPage } from '../pages/Files/FilesPage';
import { RecentPage } from '../pages/Recent/RecentPage';
import { SharedPage } from '../pages/Shared/SharedPage';
import { StarredPage } from '../pages/Starred/StarredPage';
import { MediaPage } from '../pages/Media/MediaPage';
import { UploadManagerPage } from '../pages/UploadManager/UploadManagerPage';
import { TrashPage } from '../pages/Trash/TrashPage';
import { SettingsPage } from '../pages/Settings/SettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. First Page / Root route MUST be Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. Public Auth Routes (Redirects to /dashboard if already logged in) */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* 3. Protected Application Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/recent" element={<RecentPage />} />
          <Route path="/shared" element={<SharedPage />} />
          <Route path="/starred" element={<StarredPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/uploads" element={<UploadManagerPage />} />
          <Route path="/trash" element={<TrashPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* 4. Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

