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

  // Poll counter
  const [refreshCount, setRefreshCount] = useState(0);

  const fetchQueueData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/queue`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      if (!res.ok) {
        // Attempt to surface backend error payload
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

  // Group tokens by doctor
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8">
        {/* Header Dashboard Banner */}
        <div className="glass p-6 sm:p-8 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl">
              <Monitor className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                Live Public Monitor Board
              </h1>
              <p className="text-xs text-neutral-400 dark:text-neutral-400 font-semibold mt-1">
                Real-time physician calling boards. Auto-syncs every 3 seconds.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-200/60 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wide border border-neutral-300 dark:border-neutral-700">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Auto Refreshing
            </span>
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-400 text-xs font-mono">
              Polls: {refreshCount}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-3 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <strong>Sync Error:</strong> {error} - Please verify that the backend API server is online.
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="pulse-loader">
              <div></div>
              <div></div>
            </div>
            <p className="mt-4 text-sm font-semibold text-neutral-400">Loading active token queues...</p>
          </div>
        ) : Object.keys(groupedTokens).length === 0 ? (
          <div className="glass p-12 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
            <Bell className="h-12 w-12 text-neutral-400 mx-auto animate-bounce" />
            <h3 className="mt-4 text-lg font-bold text-neutral-800 dark:text-neutral-100">No Active Tokens</h3>
            <p className="mt-2 text-neutral-500 dark:text-neutral-400 text-sm max-w-md mx-auto">
              There are currently no patient check-ins registered for today. Use the receptionist portal in the Staff Dashboard to check-in patients.
            </p>
          </div>
        ) : (
          /* Grid of Doctor Calling Boards */
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(groupedTokens).map(([docId, docInfo]) => (
              <div
                key={docId}
                className="glass rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col h-full hover:shadow-neutral-500/5 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-300"
              >
                {/* Doctor Title Header */}
                <div className="bg-neutral-500/5 p-5 border-b border-neutral-200 dark:border-neutral-800">
                  <h3 className="font-extrabold text-lg text-neutral-800 dark:text-neutral-100">{docInfo.doctorName}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
                    {docInfo.specialization}
                  </p>
                </div>

                {/* Token Display Grid */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  {/* Current Active Token Box */}
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2.5">
                      Now Calling
                    </h4>
                    {docInfo.calling ? (
                      <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-350 dark:border-neutral-800 p-6 rounded-2xl text-center shadow-inner relative overflow-hidden group">
                        {/* Glowing radial accent */}
                        <div className="absolute inset-0 bg-radial-gradient(circle, rgba(120,120,120,0.05) 0%, transparent 80%) opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="block text-5xl font-black text-neutral-900 dark:text-neutral-105 tracking-wider animate-pulse">
                          #{docInfo.calling.tokenNumber}
                        </span>
                        <span className="block text-xs font-bold text-neutral-400 uppercase tracking-wide mt-2">
                          Patient: {docInfo.calling.patient.name}
                        </span>
                      </div>
                    ) : (
                      <div className="bg-neutral-100 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800/80 p-6 rounded-2xl text-center shadow-inner">
                        <span className="block text-2xl font-extrabold text-neutral-400 dark:text-neutral-500 tracking-wider italic">
                          Idle
                        </span>
                        <span className="block text-xs font-medium text-neutral-400 mt-2">
                          No active patients being called
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Upcoming Tokens list */}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
                      Queue List
                    </h4>
                    {docInfo.waiting.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {docInfo.waiting.map((token) => (
                          <div
                            key={token.id}
                            className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300"
                            title={`Patient: ${token.patient.name}`}
                          >
                            #{token.tokenNumber}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 italic block">
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
