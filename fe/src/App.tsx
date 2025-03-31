import React, { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import { Settings } from 'lucide-react'
import Editor from './Editor'

function App() {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [dashboardData, setDashboardData] = useState<any[]>([]) // Use empty array as default
  const [configData, setConfigData] = useState<any[]>([]) // Use empty array as default
  // Fetch JSON data dynamically
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/groups')
        const data = await response.json()
        setDashboardData(data)
      } catch (error) {
        console.error('Error loading groups:', error)
      }
    }
    const fetchConfig = async () => {
      try {
        const response = await fetch('/configurations')
        const data = await response.json()
        console.log(data)
        setConfigData(data)
      } catch (error) {
        console.error('Error loading groups:', error)
      }
    }
    fetchGroups()
    fetchConfig()
  }, [])

  const backgroundImageLink =
    dashboardData.find((group) => group.title === 'Settings')?.links?.find((link) => link.title === 'Background Image')?.url ||
    '/background.jpg'

  const handleDataUpdate = (newData: any) => {
    setDashboardData(newData)
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url('${backgroundImageLink}')`,
      }}
    >
      <div className="bg-black/50 min-h-screen">
        <div className="absolute top-4 right-4">
          <button onClick={() => setIsEditorOpen(true)} className="p-2 bg-black/50 rounded-md hover:bg-black/70">
            <Settings className="w-6 h-6 text-white" />
          </button>
        </div>
        {dashboardData.length > 0 && <Dashboard data={dashboardData.filter((group) => group.title !== 'Settings')} />}
        {isEditorOpen && <Editor data={dashboardData} onClose={() => setIsEditorOpen(false)} onDataUpdate={handleDataUpdate} />}
      </div>
    </div>
  )
}

export default App
