import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "./layouts/AppLayout";
import { AIAnalysisPage } from "./pages/AIAnalysisPage";
import { ComplaintDetailsPage } from "./pages/ComplaintDetailsPage";
import { ComplaintHistoryPage } from "./pages/ComplaintHistoryPage";
import { ComplaintSubmissionPage } from "./pages/ComplaintSubmissionPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/complaints/new" element={<ComplaintSubmissionPage />} />
        <Route path="/complaints" element={<ComplaintHistoryPage />} />
        <Route path="/complaints/:id" element={<ComplaintDetailsPage />} />
        <Route path="/analysis" element={<AIAnalysisPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
