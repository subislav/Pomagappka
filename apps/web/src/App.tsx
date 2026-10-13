import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CancelBookingPage } from "./pages/CancelBookingPage";
import { CreateEventPage } from "./pages/CreateEventPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { InviteEventPage } from "./pages/InviteEventPage";
import { InvitePinPage } from "./pages/InvitePinPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
export function App() {
    return (<Routes>
      <Route path="/" element={<LandingPage />}/>
      <Route path="/logowanie" element={<LoginPage />}/>
      <Route path="/rejestracja" element={<RegisterPage />}/>
      <Route path="/anuluj/:token" element={<CancelBookingPage />}/>
      <Route path="/i/:token" element={<InvitePinPage />}/>
      <Route path="/i/:token/wydarzenie" element={<InviteEventPage />}/>
      <Route path="/panel" element={<ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>}/>
      <Route path="/panel/wydarzenia/nowe" element={<ProtectedRoute>
            <CreateEventPage />
          </ProtectedRoute>}/>
      <Route path="/panel/wydarzenia/:id" element={<ProtectedRoute>
            <EventDetailPage />
          </ProtectedRoute>}/>
    </Routes>);
}
