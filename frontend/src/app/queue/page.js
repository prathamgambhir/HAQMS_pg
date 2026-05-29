'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/common/Navbar';
import { Bell, Monitor, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function QueueMonitor() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, API_BASE_URL } = useAuth();
  const [refreshCount, setRefreshCount] = useState(0);

  const fetchQueueData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/queue`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      if (!res.ok) {
        let details = '';
        try {
          const body = await res.json();
          details = body?.error ? `: ${body.error}` : '';
        } catch (_) {}
        throw new Error(`Failed to retrieve active token queue${details}`);
      }

      const data = await res.json();
      setTokens(data);
      setError('');
    } catch (err) {
      console.error('Queue poll fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();

    const intervalId = setInterval(() => {
      setRefreshCount((prev) => prev + 1);
      fetchQueueData();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [token]);

  const groupedTokens = tokens.reduce((groups, token) => {
    const docId = token.doctorId;
    if (!groups[docId]) {
      groups[docId] = {
        doctorName: token.doctor.name,
        specialization: token.doctor.specialization,
        calling: null,
        waiting: [],
      };
    }
    if (token.status === 'CALLING') {
      groups[docId].calling = token;
    } else if (token.status === 'WAITING') {
      groups[docId].waiting.push(token);
    }
    return groups;
  }, {});

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-950">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8">
        <div className="glass gradient-bg p-6 sm:p-8 rounded-4xl shadow-xl border border-slate-200 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-100 text-slate-950">
              <Monitor className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-950 flex items-center gap-2">
                Live Public Monitor Board
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Real-time physician calling boards. Auto-syncs every 3 seconds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-950 text-xs font-semibold uppercase tracking-wide border border-slate-200">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Auto Refreshing
            </span>
            <div className="p-2 bg-slate-100 rounded-2xl text-slate-500 text-xs font-mono">
              {refreshCount} polls
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center gap-3 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <strong>Sync Error:</strong> {error} - Please verify that the backend API server is online.
            </div>
          </div>
        )}

        {loading && tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="pulse-loader">
              <div></div>
              <div></div>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-500">Loading active token queues...</p>
          </div>
        ) : Object.keys(groupedTokens).length === 0 ? (
          <div className="glass p-12 text-center rounded-4xl border border-dashed border-slate-200">
            <Bell className="h-12 w-12 text-slate-400 mx-auto animate-bounce" />
            <h3 className="mt-4 text-lg font-bold text-slate-950">No Active Tokens</h3>
            <p className="mt-2 text-slate-500 text-sm max-w-md mx-auto leading-6">
              There are currently no patient check-ins registered for today. Use the receptionist portal in the Staff Dashboard to check in patients.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(groupedTokens).map(([docId, docInfo]) => (
              <div
                key={docId}
                className="glass rounded-4xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:border-slate-300"
              >
                <div className="bg-slate-100/70 p-5 border-b border-slate-200">
                  <h3 className="font-semibold text-lg text-slate-950">{docInfo.doctorName}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-[0.24em] mt-1">
                    {docInfo.specialization}
                  </p>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                      Now Calling
                    </h4>
                    {docInfo.calling ? (
                      <div className="bg-white border border-slate-200 p-6 rounded-3xl text-center shadow-inner relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.08)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="block text-5xl font-black text-slate-950 tracking-[0.18em] animate-pulse">
                          #{docInfo.calling.tokenNumber}
                        </span>
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide mt-2">
                          Patient: {docInfo.calling.patient.name}
                        </span>
                        <div className="mt-3 inline-flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                            Calling
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 p-6 rounded-3xl text-center shadow-inner">
                        <span className="block text-2xl font-extrabold text-slate-400 tracking-[0.18em] italic">
                          Idle
                        </span>
                        <span className="block text-xs font-medium text-slate-400 mt-2">
                          No active patients being called
                        </span>
                        <div className="mt-3 inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-500">
                          Idle
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Queue List
                    </h4>
                    {docInfo.waiting.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {docInfo.waiting.map((token) => (
                          <div
                            key={token.id}
                            className="px-3 py-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-transform hover:-translate-y-0.5 hover:shadow-sm"
                            title={`Patient: ${token.patient.name}`}
                          >
                            #{token.tokenNumber}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic block">
                        No upcoming patients in queue
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
