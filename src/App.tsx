// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { apiFetch } from './lib/api'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SignIn from './pages/SignIn'
import Gate from './pages/Gate'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

function App() {
  const { isSignedIn, isLoaded, getToken } = useAuth()
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) { setLoading(false); return }

    getToken()
      .then(token => apiFetch<{ user: { role: string } }>('/me', token))
      .then(data => setRole(data.user.role))
      .catch(() => setRole('regular'))
      .finally(() => setLoading(false))
  }, [isLoaded, isSignedIn])

  if (!isLoaded || loading) return <AppLoading />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar role={role} />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route
            path="/"
            element={
              !isSignedIn ? <SignIn /> :
              role === 'admin' ? <Navigate to="/admin" replace /> :
              role === 'contributor' ? <Navigate to="/dashboard" replace /> :
              <Gate />
            }
          />
          <Route
            path="/dashboard"
            element={role === 'contributor' || role === 'admin' ? <Dashboard role={role!} /> : <Navigate to="/" replace />}
          />
          <Route
            path="/admin"
            element={role === 'admin' ? <Admin /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}

function AppLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#080f1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <span style={{ fontSize: 28, color: '#C9A94A' }}>✝</span>
      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 20 }}>
        {[8,14,20,14,8].map((h, i) => (
          <div key={i} style={{ width: 3, height: h, background: '#C9A94A', borderRadius: 2, animation: 'bar 1.2s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <style>{`@keyframes bar { 0%,100%{transform:scaleY(.4);opacity:.3} 50%{transform:scaleY(1);opacity:1} }`}</style>
    </div>
  )
}

export default App