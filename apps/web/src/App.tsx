import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CancelBookingPage } from "./pages/CancelBookingPage";
import { CreateEventPage } from "./pages/CreateEventPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { InviteEventPage } from "./pages/InviteEventPage";
import { InvitePinPage } from "./pages/InvitePinPage";
import { CookiesPage } from "./pages/CookiesPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { PrivacyContactPage } from "./pages/PrivacyContactPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { TermsPage } from "./pages/TermsPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/polityka-prywatnosci" element={<PrivacyPolicyPage />} />
      <Route path="/regulamin" element={<TermsPage />} />
      <Route path="/cookies" element={<CookiesPage />} />
      <Route path="/kontakt-prywatnosc" element={<PrivacyContactPage />} />
      <Route path="/logowanie" element={<LoginPage />} />
      <Route path="/rejestracja" element={<RegisterPage />} />
      <Route path="/zapomniane-haslo" element={<ForgotPasswordPage />} />
      <Route path="/reset-hasla" element={<ResetPasswordPage />} />
      <Route path="/anuluj/:token" element={<CancelBookingPage />} />
      <Route path="/i/:token" element={<InvitePinPage />} />
      <Route path="/i/:token/wydarzenie" element={<InviteEventPage />} />
      <Route
        path="/panel"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/panel/wydarzenia/nowe"
        element={
          <ProtectedRoute>
            <CreateEventPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/panel/wydarzenia/:id"
        element={
          <ProtectedRoute>
            <EventDetailPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
