'use client';

import Link from 'next/link';
import { Activity, ShieldAlert, MonitorPlay, Users, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-950">
      <main className="py-16 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-950 text-sm font-semibold mb-6 border border-slate-200 animate-pulse">
            <Activity className="h-4 w-4" />
            Live Queue Tracking Enabled
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-950">
            HAQMS
          </h1>
          <p className="text-xl sm:text-2xl font-semibold mt-4 text-slate-700">
            Hospital Appointment & Queue Management System
          </p>
          <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto leading-8">
            Welcome to the HAQMS testing environment. This portal serves as a deliberately flawed, fully functional reference application designed to evaluate software engineering candidates.
          </p>
        </div>

        <div className="mt-14 max-w-4xl mx-auto grid gap-8 sm:grid-cols-2">
          <Link href="/login" className="group">
            <div className="glass p-8 rounded-[2rem] shadow-xl border border-slate-200 text-left hover:border-slate-300 transition-all duration-300">
              <div className="inline-flex items-center justify-center p-4 w-fit rounded-2xl bg-slate-100 text-slate-950 transition group-hover:bg-slate-950 group-hover:text-white">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="mt-8 text-2xl font-semibold text-slate-950 flex items-center gap-2">
                Staff Portal
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </h2>
              <p className="mt-3 text-slate-500 text-sm leading-6">
                Access the staff dashboard with admin, doctor, and receptionist workflows for appointments and queue management.
              </p>
            </div>
          </Link>

          <Link href="/queue" className="group">
            <div className="glass p-8 rounded-[2rem] shadow-xl border border-slate-200 text-left hover:border-slate-300 transition-all duration-300">
              <div className="inline-flex items-center justify-center p-4 w-fit rounded-2xl bg-slate-100 text-slate-950 transition group-hover:bg-slate-950 group-hover:text-white">
                <MonitorPlay className="h-6 w-6" />
              </div>
              <h2 className="mt-8 text-2xl font-semibold text-slate-950 flex items-center gap-2">
                Live Public Monitor
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </h2>
              <p className="mt-3 text-slate-500 text-sm leading-6">
                Real-time queue board tracking patient check-ins and physician calling tokens.
              </p>
            </div>
          </Link>
        </div>

        <section className="mt-16">
          <div className="glass max-w-3xl mx-auto p-8 rounded-[2rem] border border-slate-200 shadow-xl flex flex-col sm:flex-row gap-6">
            <div className="flex-none rounded-2xl bg-slate-100 p-4">
              <ShieldAlert className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Assessment Environment Notice</h3>
              <p className="mt-2 text-slate-600 text-sm leading-7">
                This repository contains architectural, database, frontend, and security bugs. Your evaluation criteria will measure your ability to identify, trace, profile, and fix issues systematically.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-slate-500 text-sm">
        HAQMS v1.0.0-deliberate-bugs © {new Date().getFullYear()} Candidate Evaluation Framework.
      </footer>
    </div>
  );
}
