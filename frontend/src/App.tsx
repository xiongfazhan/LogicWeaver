import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Builder from './pages/Builder'
import Review from './pages/Review'
import Flowchart from './pages/Flowchart'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/workflow/:id/builder" element={<Builder />} />
      <Route path="/workflow/:id/review" element={<Review />} />
      <Route path="/workflow/:id/flowchart" element={<Flowchart />} />
    </Routes>
  )
}

export default App
