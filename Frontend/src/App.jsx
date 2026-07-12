import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import AppHome from './pages/AppHome'
import CursorTrail from './components/ui/CursorTrail'
import RequireAuth from './components/auth/RequireAuth'
import { AuthProvider } from './context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CursorTrail />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/onboarding"
            element={
              <RequireAuth requireOnboarding={false}>
                <Onboarding />
              </RequireAuth>
            }
          />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppHome />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
