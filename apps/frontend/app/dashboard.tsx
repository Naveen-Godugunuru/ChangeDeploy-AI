'use client';

import { useEffect, useState } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type ChangeRequest = {
  id: string;
  title: string;
  environment: string;
  owner: string;
  risk_score: number;
  status: string;
  deployment_status: string;
  rollback_status: string;
};

export default function DashboardPage() {
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/changes`
        );

        const data = await res.json();

        setChanges(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  

  const stats = [
    {
      label: 'Total Changes',
      value: changes.length,
      tone: 'cyan',
    },
    {
      label: 'Approved',
      value: changes.filter(
        (c) => c.status === 'Approved'
      ).length,
      tone: 'emerald',
    },
    {
      label: 'Pending Review',
      value: changes.filter(
        (c) => c.status === 'Pending Approval'
      ).length,
      tone: 'amber',
    },
    {
      label: 'High Risk',
      value: changes.filter(
        (c) => c.risk_score >= 70
      ).length,
      tone: 'rose',
    },
    {
      label: 'Rollbacks',
      value: changes.filter(
        (c) => c.rollback_status === 'Executed'
      ).length,
      tone: 'amber',
    },
  ];


  const pipeline = [
    'Validate build artifacts',
    'Promote to staging',
    'Run regression suite',
    'Production readiness check',
    'Approval gate',
    ];
  
    if (loading) {
    return (
    <div className="text-white p-8">
    Loading Dashboard...
    </div>
    );

    }
  
    return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Overview</p>
          <h3 className="mt-2 text-3xl font-bold text-white">Deployment dashboard</h3>
        </div>
        <button
  onClick={() => {
    window.location.href = '/create-deployment';
  }}
  className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
>
  + New Deployment
</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/20">
            <div className="text-sm text-slate-400">{item.label}</div>
            <div className="mt-3 text-3xl font-bold text-white">{item.value}</div>
            <div className={`mt-3 h-2 w-20 rounded-full ${
              item.tone === 'cyan' ? 'bg-cyan-500' :
              item.tone === 'emerald' ? 'bg-emerald-500' :
              item.tone === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
            }`} />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white">Open change requests</h4>
            <div className="text-sm text-slate-400">Live Data</div>
          </div>

          <div className="space-y-3">
          {changes.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-400">{item.id}</div>
                    <div className="mt-1 text-lg font-semibold text-white">{item.title}</div>
                  </div>
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                    {item.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                  <span>{item.environment}</span>
                  <span>Owner: {item.owner}</span>
                  <span>Risk: {item.risk_score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h4 className="text-lg font-semibold text-white">Jenkins pipeline</h4>
          <div className="mt-6 space-y-3">
            {pipeline.map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  index < 3 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-200'
                }`}>
                  {index + 1}
                </div>
                <div className="text-sm text-slate-200">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

