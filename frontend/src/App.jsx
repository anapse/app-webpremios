// App.jsx
import { HashRouter as Router, Routes, Route, Navigate  } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Tickets from './pages/Tickets'
import Winners from './pages/Winners'
import RegistroPage from './pages/RegistroPage'
import Dashboard from './pages/Dashboard'

function App() {
   const isAdmin = true;
  return (
    <Router>
      <Navbar />
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
    </Router>
  )
}

export default App
