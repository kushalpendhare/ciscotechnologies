import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Solutions from './pages/Solutions'
import Partners from './pages/Partners'
import CaseStudies from './pages/CaseStudies'
import Contact from './pages/Contact'
import Support from './pages/Support'
import AdminPortal from './pages/AdminPortal'

const isAdminSubdomain = window.location.hostname.startsWith('admin.')

function App() {
  return (
    <Router>
      {isAdminSubdomain ? (
        // Admin subdomain — show ONLY admin portal, no navbar
        <Routes>
          <Route path="*" element={<AdminPortal />} />
        </Routes>
      ) : (
        // Public site
        <>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/support" element={<Support />} />
            <Route path="/admin" element={<AdminPortal />} />
          </Routes>
        </>
      )}
    </Router>
  )
}

export default App