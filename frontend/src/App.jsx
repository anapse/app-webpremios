// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense,React } from 'react'
import Navbar from './components/Navbar'
import LibroReclamaciones from './pages/LibroReclamaciones'
import Footer from './components/Footer'
import whatsappIcon from './assets/whatsapp.png'
import LoadingSpinner from './components/LoadingSpinner'
import { LoadingProvider } from './context/LoadingContext'
import PageLoader from './components/PageLoader'
import ProtectedRoute from './components/ProtectedRoute'


// Lazy loading de páginas
const Home = lazy(() => import('./pages/Home'))
const Tickets = lazy(() => import('./pages/Tickets'))
const Winners = lazy(() => import('./pages/Winners'))
const RegistroPage = lazy(() => import('./pages/RegistroPage'))
const RegistroNiubizPage = lazy(() => import('./pages/RegistroNiubizPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Terminos = lazy(() => import('./pages/Terminos'));
const Niubizpay = lazy(() => import('./pages/Niubizpay'));
const PaymentResult = lazy(() => import('./components/PaymentResult'));

function App() {
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
            <Route 
              path="/niubiz" 
              element={
                <ProtectedRoute>
                  <RegistroNiubizPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/libro-reclamaciones" element={<LibroReclamaciones/>} />
            <Route path="/terminos" element={<Terminos />} />
            <Route path="/pay" element={<Niubizpay />} />
            <Route path="/payment-result" element={<PaymentResult />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
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
        
        <Footer />
      </Router> 
    </LoadingProvider>
  )
}

export default App

