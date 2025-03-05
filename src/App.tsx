import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import { Settings } from 'lucide-react';
import Editor from './Editor';

function App() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<any[]>([]); // Use empty array as default

  // Fetch JSON data dynamically
  useEffect(() => {
    fetch('/assets/data.json') // Ensure the path matches your Vite build
      .then((response) => response.json())
      .then((data) => {console.log(data);setDashboardData(data)})
      .catch((error) => console.error('Error loading JSON:', error));
  }, []);

  const backgroundImageLink =
    dashboardData.find((group) => group.group === 'Settings')?.links.find((link) => link.title === 'Background Image')?.url ||
    'https://images.unsplash.com/photo-1682685797527-645515479844?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8A%3D%3D';

  const handleDataUpdate = (newData: any) => {
    setDashboardData(newData);
  };

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
        {dashboardData.length > 0 && <Dashboard data={dashboardData.filter((group) => group.group !== 'Settings')} />}
        {isEditorOpen && <Editor data={dashboardData} onClose={() => setIsEditorOpen(false)} onDataUpdate={handleDataUpdate} />}
      </div>
    </div>
  );
}

export default App;
