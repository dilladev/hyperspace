// Import React and necessary hooks/components
import React, { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import { Settings } from 'lucide-react'
import Editor from './Editor'

function App() {
  // State to toggle the visibility of the Editor
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  // State to store dashboard group data fetched from the backend
  const [dashboardData, setDashboardData] = useState<any[]>([])

  // State to store additional configuration data
  const [configData, setConfigData] = useState<any[]>([])

  // useEffect hook to fetch data from the backend when the app loads
  useEffect(() => {
    // Fetch all groups (main data for dashboard and editor)
    const fetchGroups = async () => {
      try {
        const response = await fetch('/groups')
        const data = await response.json()
        setDashboardData(data)
      } catch (error) {
        console.error('Error loading groups:', error)
      }
    }

    // Fetch configuration-specific data (like background image)
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

    // Call both APIs on mount
    fetchGroups()
    fetchConfig()
  }, [])

  // Get the background image URL from a specific "Settings" group and "Background Image" link
  const backgroundImageLink =
    dashboardData.find((group) => group.title === 'Settings')?.links?.find((link) => link.title === 'Background Image')?.url ||
    '/background.jpg' // fallback default background

  // Callback to handle updated data when saved from the editor
  const handleDataUpdate = (newData: any) => {
    setDashboardData(newData)
  }

  return (
    // Root div with dynamic background image
    <div
      className="min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url('${backgroundImageLink}')`,
      }}
    >
      <div className="bg-black/50 min-h-screen">
        {/* Settings button to open the editor */}
        <div className="absolute top-4 right-4">
          <button onClick={() => setIsEditorOpen(true)} className="p-2 bg-black/50 rounded-md hover:bg-black/70">
            <Settings className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Render dashboard if data is available (excluding the Settings group) */}
        {dashboardData.length > 0 && <Dashboard data={dashboardData.filter((group) => group.title !== 'Settings')} />}

        {/* Conditionally render the Editor modal if open */}
        {isEditorOpen && (
          <Editor
            data={dashboardData}
            onClose={() => setIsEditorOpen(false)}
            onDataUpdate={handleDataUpdate}
          />
        )}
      </div>
    </div>
  )
}

export default App
