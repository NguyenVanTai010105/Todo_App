import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HistoryPage from "./pages/HistoryPage";
import ChatPage from "./pages/ChatPage";
import StatsPage from "./pages/StatsPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage.jsx";
import PaymentCancelPage from "./pages/PaymentCancelPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import ChatWidget from "./components/ChatWidget";

function App() {
  const { isAuthed, loading } = useAuth();

  return (
    <>
      <Toaster />

      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              loading ? null : isAuthed ? <HomePage /> : <Navigate to="/login" replace />
            }
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/payment/thanh-cong"
            element={
              loading ? null : isAuthed ? (
                <PaymentSuccessPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/payment/huy" element={<PaymentCancelPage />} />
          <Route
            path="/history"
            element={
              loading ? null : isAuthed ? <HistoryPage /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/chat"
            element={
              loading ? null : isAuthed ? <ChatPage /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/stats"
            element={
              loading ? null : isAuthed ? <StatsPage /> : <Navigate to="/login" replace />
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Floating chat widget (only when authed) */}
        {loading ? null : isAuthed ? <ChatWidget /> : null}
      </BrowserRouter>
    </>
  );
}

export default App;
