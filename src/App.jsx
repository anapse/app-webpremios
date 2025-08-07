// App.jsx
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Tickets from './pages/Tickets'
import Winners from './pages/Winners'
import RegistroPage from './pages/RegistroPage'

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/ganadores" element={<Winners />} />
        <Route path="/registro" element={<RegistroPage />} />
      </Routes>
    </Router>
  )
}

export default App
