import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Videos from './pages/Videos';
import Queue from './pages/Queue';
import SettingsPage from './pages/Settings';
import Logs from './pages/Logs';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'videos':
        return <Videos />;
      case 'queue':
        return <Queue />;
      case 'settings':
        return <SettingsPage />;
      case 'logs':
        return <Logs />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      <footer className="glass-panel border-t border-gray-800 py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-500">
          ShortForge Automated 9:16 Short-Form Video Processor &copy; {new Date().getFullYear()} — Production Ready
        </div>
      </footer>
    </div>
  );
}
