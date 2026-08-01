import React, { useState, useEffect } from 'react';
import { Video, Layers, Settings, FileText, Cpu, Film, Palette, Zap } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const [theme, setTheme] = useState(localStorage.getItem('shortforge_theme') || 'cyberpunk');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('shortforge_theme', theme);
  }, [theme]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Cpu },
    { id: 'videos', label: 'Videos', icon: Film },
    { id: 'queue', label: 'Upload Queue', icon: Layers },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'logs', label: 'Logs', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-cyan-500/20 bg-[#060913]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Cyberpunk Logo & Badge */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 glow-cyber">
              <Video className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-black gradient-text-cyber tracking-wider">
                ShortForge <span className="text-cyan-400 text-xs font-bold font-mono">2.0</span>
              </span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-300">
                  STUDIO ENGINE 9:16
                </span>
              </div>
            </div>
          </div>

          {/* Center Nav Navigation Links */}
          <nav className="flex space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 scale-105 border border-cyan-400/40'
                      : 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-950/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Theme Selector Dropdown */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-gray-900/80 p-1.5 rounded-xl border border-gray-800">
              <Palette className="w-4 h-4 text-cyan-400" />
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-300 focus:outline-none cursor-pointer pr-1"
              >
                <option value="cyberpunk" className="bg-gray-900 text-cyan-400">Cyberpunk Neon</option>
                <option value="midnight" className="bg-gray-900 text-indigo-400">Midnight Studio</option>
                <option value="emerald" className="bg-gray-900 text-emerald-400">Emerald Matrix</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
