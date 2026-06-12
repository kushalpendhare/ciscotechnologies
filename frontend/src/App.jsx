import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Solutions from './pages/Solutions'
import Partners from './pages/Partners'
import CaseStudies from './pages/CaseStudies'
import Contact from './pages/Contact'

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/solutions"   element={<Solutions />} />
        <Route path="/partners"    element={<Partners />} />
        <Route path="/case-studies" element={<CaseStudies />} />
        <Route path="/contact"     element={<Contact />} />
      </Routes>
    </Router>
  )
}

export default App