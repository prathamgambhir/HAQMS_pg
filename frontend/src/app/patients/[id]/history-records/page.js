'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/common/Navbar';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, ArrowLeft, ClipboardList, Clock, HeartHandshake, User } from 'lucide-react';

export default function PatientHistoryRecords() {
  const { user, token, API_BASE_URL } = useAuth();
  const router = useRouter();
  const params = useParams();
  const patientId = params.id;

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Navigation Guard
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user]);

  useEffect(() => {
    if (!user || !patientId || !token) return;

    const fetchPatientData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Patient record not found.');
          }
          throw new Error('Failed to retrieve patient history records.');
        }
        const data = await res.json();
        setPatient(data);
      } catch (err) {
        console.error('Fetch patient details error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId, token, user]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-8 space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="pulse-loader">
              <div></div>
              <div></div>
            </div>
            <p className="mt-4 text-sm font-semibold text-neutral-400">Loading patient history details...</p>
          </div>
        ) : error ? (
          <div className="glass p-8 text-center rounded-2xl border border-rose-500/20 shadow-lg max-w-md mx-auto">
            <h3 className="text-lg font-bold text-rose-500">Record Load Error</h3>
            <p className="mt-2 text-neutral-500 dark:text-neutral-400 text-sm">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Patient Header Block */}
            <div className="glass p-6 sm:p-8 rounded-2xl shadow-md border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
                    {patient.name}
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-semibold">
                    Patient History File ID: <span className="font-mono text-neutral-400">{patient.id}</span>
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right text-sm text-neutral-600 dark:text-neutral-350">
                <p className="font-bold">{patient.age} years / <span className="capitalize">{patient.gender}</span></p>
                <p className="text-xs text-neutral-450 mt-1">Contact: {patient.phoneNumber}</p>
                {patient.email && <p className="text-xs text-neutral-450">{patient.email}</p>}
              </div>
            </div>

            {/* Medical Anamnesis / History */}
            <div className="glass p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-md space-y-4">
              <h3 className="text-lg font-extrabold text-neutral-805 dark:text-neutral-100 flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
                Clinical Background & History
              </h3>
              <div className="p-4 rounded-xl bg-neutral-100/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 text-xs">
                <p className="text-neutral-700 dark:text-neutral-300 leading-6 text-sm font-semibold whitespace-pre-line">
                  {patient.medicalHistory ? patient.medicalHistory.toUpperCase() : 'NO MEDICAL ANAMNESIS OR HISTORY RECORDED FOR THIS PATIENT.'}
                </p>
              </div>
            </div>

            {/* Consultation Appointments History list */}
            <div className="glass p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-md space-y-4">
              <h3 className="text-lg font-extrabold text-neutral-805 dark:text-neutral-100 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
                Hospital Visit Logs & Bookings
              </h3>

              {!patient.appointments || patient.appointments.length === 0 ? (
                <p className="text-center py-6 text-neutral-400 text-sm">No recorded clinical appointments found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-sm text-left">
                    <thead>
                      <tr className="text-neutral-400 uppercase tracking-widest text-xxs font-bold border-b border-neutral-200 dark:border-neutral-800">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Reason for Visit</th>
                        <th className="pb-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {patient.appointments.map((app) => (
                        <tr key={app.id} className="hover:bg-neutral-500/5 transition-colors">
                          <td className="py-3.5 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                            {new Date(app.appointmentDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="py-3.5 text-neutral-550 dark:text-neutral-400 font-semibold">
                            {app.reason || 'No details provided'}
                          </td>
                          <td className="py-3.5 text-right">
                            <span className={`inline-flex px-2.5 py-0.5 rounded text-xxs font-extrabold tracking-wide uppercase ${app.status === 'COMPLETED' ? 'bg-neutral-100 text-neutral-850 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700' : app.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              {app.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
