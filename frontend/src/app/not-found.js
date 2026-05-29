'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Activity } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-slate-50 py-12 px-6 lg:px-8 text-center text-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-950 font-extrabold text-3xl mb-8">
          <Activity className="h-8 w-8 animate-pulse" />
          HAQMS
        </Link>
        
        <div className="glass p-8 rounded-4xl border border-slate-200 shadow-xl max-w-sm mx-auto">
          <div className="p-4 bg-slate-100 text-slate-950 rounded-full w-fit mx-auto mb-6">
            <ShieldAlert className="h-10 w-10" />
          </div>
          
          <h2 className="text-4xl font-black text-slate-950">404</h2>
          <h3 className="mt-2 text-xl font-bold text-slate-950">
            Page not found
          </h3>
          
          <p className="mt-4 text-sm text-slate-500 leading-6">
            We could not find the page you are looking for. Try going back to the dashboard or homepage.
          </p>

          <div className="mt-8">
            <Link
              href="/"
              className="glow-btn inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold text-white bg-slate-950 hover:bg-slate-800 transition-all duration-300 w-full"
            >
              <ArrowLeft className="h-4 w-4" />
              Back Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
