
import './App.css'
import StudentsTable from './pages/StudentsTable'
import Website from './pages/Website'
import { SyncDashboard } from './components/sync-dashboard'
import { Route, Routes } from 'react-router-dom'

function App() {

  return (
    <>
  <div></div>
    <Routes>
      <Route path="/" element={<Website/>} />
      <Route path="/students" element={<StudentsTable />} />
      <Route path="/SyncDashboard" element={<SyncDashboard />} />
      {/* add `/students/new`, `/students/edit/:id`, and `/students/:id` for the forms/details views */}
    </Routes>

    </>
  )
}

export default App
