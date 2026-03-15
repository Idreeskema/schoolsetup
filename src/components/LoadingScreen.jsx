import React from 'react';
import { School } from 'lucide-react';

export default function LoadingScreen({ message = "Loading Dashboard..." }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      
      <div className="relative flex flex-col items-center">
        {/* Logo Container */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center p-5 shadow-2xl shadow-blue-500/20 mb-8 animate-bounce-gentle">
          <School className="text-white w-full h-full" />
        </div>

        {/* Loading Indicator */}
        <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mb-4 p-[1px]">
          <div className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-full w-full animate-loading-bar" />
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-white text-xl font-semibold mb-1 tracking-tight">{message}</h2>
          <p className="text-gray-400 text-sm font-medium animate-pulse">Syncing encrypted data...</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s infinite linear;
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}
