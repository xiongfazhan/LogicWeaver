import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Review from './pages/Review'
import Flowchart from './pages/Flowchart'
import WorkerCollect from './pages/WorkerCollect'
import ExpertOrganize from './pages/ExpertOrganize'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/workflow/:id/worker" element={<WorkerCollect />} />
      <Route path="/workflow/:id/expert" element={<ExpertOrganize />} />
      <Route path="/workflow/:id/review" element={<Review />} />
      <Route path="/workflow/:id/flowchart" element={<Flowchart />} />
    </Routes>
  )
}

export default App
