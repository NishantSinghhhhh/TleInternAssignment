// App.tsx
import './App.css'
import StudentsTable from './pages/StudentsTable'
import Website from './pages/Website'
import { SyncDashboard } from './components/sync-dashboard'
import { Navbar } from './components/navbar'
import { Route, Routes } from 'react-router-dom'

function App() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Website/>} />
            <Route path="/students" element={<StudentsTable />} />
            <Route path="/Admin" element={<SyncDashboard />} />
            {/* add `/students/new`, `/students/edit/:id`, and `/students/:id` for the forms/details views */}
          </Routes>
        </div>
      </main>
    </>
  )
}

export default App