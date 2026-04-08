import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import { useAuth } from "./context/AuthContext.jsx";

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

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
