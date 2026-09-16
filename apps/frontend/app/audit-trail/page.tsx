'use client';

import { useEffect, useState } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type AuditEvent = {
  id: string;
  change_id: string;
  action: string;
  details: string;
  user: string;
  created_at: string;
};

export default function AuditTrailPage() {
  const [trail, setTrail] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/audit`);
        const data = await res.json();
        setTrail(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, []);

  const getActionColor = (action: string) => {
    const value = action.toLowerCase();

    if (value.includes('approved'))
      return 'border-green-500';

    if (value.includes('deployment'))
      return 'border-blue-500';

    if (value.includes('rollback'))
      return 'border-orange-500';

    if (value.includes('rejected'))
      return 'border-red-500';

    if (value.includes('created'))
      return 'border-cyan-500';

    return 'border-slate-700';
  };

  const getActionIcon = (action: string) => {
    const value = action.toLowerCase();

    if (value.includes('approved'))
      return '✅';

    if (value.includes('deployment'))
      return '🚀';

    if (value.includes('rollback'))
      return '🔄';

    if (value.includes('rejected'))
      return '❌';

    if (value.includes('created'))
      return '📝';

    return '📌';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <p className="text-white text-lg">
          Loading Audit Logs...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-semibold">
            Compliance & Governance
          </p>

          <h1 className="text-4xl font-bold text-white mt-2">
            Audit Trail
          </h1>

          <p className="text-slate-400 mt-2">
            Complete visibility into change approvals,
            deployments, failures and rollbacks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <p className="text-slate-400 text-sm">
              Total Events
            </p>
            <p className="text-3xl font-bold text-white mt-2">
              {trail.length}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <p className="text-slate-400 text-sm">
              Approvals
            </p>
            <p className="text-3xl font-bold text-green-400 mt-2">
              {
                trail.filter((x) =>
                  x.action.toLowerCase().includes('approved')
                ).length
              }
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <p className="text-slate-400 text-sm">
              Deployments
            </p>
            <p className="text-3xl font-bold text-blue-400 mt-2">
              {
                trail.filter((x) =>
                  x.action.toLowerCase().includes('deployment')
                ).length
              }
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <p className="text-slate-400 text-sm">
              Rollbacks
            </p>
            <p className="text-3xl font-bold text-orange-400 mt-2">
              {
                trail.filter((x) =>
                  x.action.toLowerCase().includes('rollback')
                ).length
              }
            </p>
          </div>

        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">

          {trail.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              No audit events found
            </div>
          ) : (
            <div className="space-y-4">

              {trail.map((event, index) => (
                <div
                  key={event.id}
                  className={`flex gap-4 border rounded-xl p-4 bg-slate-950/60 ${getActionColor(
                    event.action
                  )}`}
                >
                  <div className="flex flex-col items-center">

                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                      {getActionIcon(event.action)}
                    </div>

                    {index !== trail.length - 1 && (
                      <div className="w-px flex-1 mt-2 bg-slate-700" />
                    )}

                  </div>

                  <div className="flex-1">

                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-white">
                        {event.action}
                      </h3>

                      <span className="text-xs text-slate-400">
                        {new Date(
                          event.created_at
                        ).toLocaleString()}
                      </span>
                    </div>

                    <p className="mt-2 text-cyan-300 text-sm">
                      Change ID: {event.change_id}
                    </p>

                    <p className="mt-1 text-slate-300 text-sm">
                      User: {event.user}
                    </p>

                    <p className="mt-2 text-slate-400 text-sm leading-6">
                      {event.details}
                    </p>

                  </div>
                </div>
              ))}

            </div>
          )}

        </div>
      </div>
    </main>
  );
}