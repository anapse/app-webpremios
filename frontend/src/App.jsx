// App.jsx
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense,React } from 'react'
import Navbar from './components/Navbar'
import LibroReclamaciones from './pages/LibroReclamaciones'
import Footer from './components/Footer'
import whatsappIcon from './assets/whatsapp.png'
import LoadingSpinner from './components/LoadingSpinner'
import { LoadingProvider } from './context/LoadingContext'
import PageLoader from './components/PageLoader'
// Lazy loading de páginas
const Home = lazy(() => import('./pages/Home'))
const Tickets = lazy(() => import('./pages/Tickets'))
const Winners = lazy(() => import('./pages/Winners'))
const RegistroPage = lazy(() => import('./pages/RegistroPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Terminos = lazy(() => import('./pages/Terminos'));

function App() {
  const isAdmin = true

  return (
        <LoadingProvider>
    <Router>
      <Navbar />
        <PageLoader />
      <Suspense fallback={<LoadingSpinner text="Cargando sección..." />}>
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
            <Route path="/libro-reclamaciones" element={<LibroReclamaciones/>} />
            <Route path="/terminos" element={<Terminos />} />
        </Routes>
      
      </Suspense>
      <a
  href="https://wa.me/message/VTSAYXAD74NMM1"
  className="whatsapp-float"
  target="_blank"
  rel="noopener noreferrer"
>
  <img src={whatsappIcon} alt="WhatsApp" />
</a>
          <Footer /> {/* <-- siempre visible */}
    </Router> 
     </LoadingProvider>
  )
}

export default App

