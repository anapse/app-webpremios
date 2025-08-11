// App.jsx
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Navbar from './components/Navbar'

// Lazy loading de páginas
const Home = lazy(() => import('./pages/Home'))
const Tickets = lazy(() => import('./pages/Tickets'))
const Winners = lazy(() => import('./pages/Winners'))
const RegistroPage = lazy(() => import('./pages/RegistroPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))

function App() {
  const isAdmin = true

  return (
    <Router>
      <Navbar />
      <Suspense fallback={<p>Cargando página...</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/ganadores" element={<Winners />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="*" element={<Home />} />
          <Route
            path="/dashboard"
            element={isAdmin ? <Dashboard /> : <Navigate to="/" />}
          />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App

