'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Activity, LogOut, LayoutDashboard, MonitorPlay, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="glass sticky top-0 z-50 border-b border-slate-200 px-6 py-4 shadow-md backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-slate-950 font-semibold text-2xl tracking-tight">
          <Activity className="h-6 w-6 text-slate-950 animate-pulse" />
          <span>HAQMS</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-950 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/queue"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-950 transition-colors"
          >
            <MonitorPlay className="h-4 w-4" />
            Live Queue
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-slate-950">{user.name}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase bg-slate-100 text-slate-950 border border-slate-200">
              <Shield className="h-3 w-3" />
              {user.role}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg bg-slate-950 text-white hover:bg-slate-800 transition-all duration-300 focus:outline-none"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
