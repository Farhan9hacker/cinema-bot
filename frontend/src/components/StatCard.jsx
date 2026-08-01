import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, color = 'indigo', progress }) {
  const colorMap = {
    indigo: 'from-indigo-500/20 to-violet-500/10 text-indigo-400 border-indigo-500/30',
    emerald: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
    rose: 'from-rose-500/20 to-pink-500/10 text-rose-400 border-rose-500/30',
    cyan: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30',
  };

  const bgStyle = colorMap[color] || colorMap.indigo;

  return (
    <div className={`p-5 rounded-2xl glass-panel border bg-gradient-to-br ${bgStyle} transition-all duration-200 hover:scale-[1.01]`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</span>
        {Icon && (
          <div className="p-2 rounded-xl bg-gray-900/60 border border-gray-800">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{value}</span>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>

      {progress !== undefined && (
        <div className="mt-3 w-full bg-gray-900/80 h-2 rounded-full overflow-hidden border border-gray-800">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
