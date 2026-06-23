import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import GlicemiaList from './pages/GlicemiaList'
import GlicemiaForm from './pages/GlicemiaForm'
import Treino from './pages/Treino'
import Esteira from './pages/Esteira'
import Alimentacao from './pages/Alimentacao'
import Mais from './pages/Mais'
import Peso from './pages/Peso'
import Relatorio from './pages/Relatorio'

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-dvh bg-app flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted text-sm">Carregando...</p>
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh bg-app flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />

      <Route path="/onboarding" element={
        <RequireAuth>
          <Onboarding />
        </RequireAuth>
      } />

      <Route path="/dashboard" element={
        <RequireAuth>
          {user && profile && !profile.nome ? <Navigate to="/onboarding" replace /> : <Dashboard />}
        </RequireAuth>
      } />

      <Route path="/glicemia" element={<RequireAuth><GlicemiaList /></RequireAuth>} />
      <Route path="/glicemia/nova" element={<RequireAuth><GlicemiaForm /></RequireAuth>} />
      <Route path="/treino" element={<RequireAuth><Treino /></RequireAuth>} />
      <Route path="/esteira" element={<RequireAuth><Esteira /></RequireAuth>} />
      <Route path="/alimentacao" element={<RequireAuth><Alimentacao /></RequireAuth>} />
      <Route path="/mais" element={<RequireAuth><Mais /></RequireAuth>} />
      <Route path="/peso" element={<RequireAuth><Peso /></RequireAuth>} />
      <Route path="/relatorio" element={<RequireAuth><Relatorio /></RequireAuth>} />

      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
