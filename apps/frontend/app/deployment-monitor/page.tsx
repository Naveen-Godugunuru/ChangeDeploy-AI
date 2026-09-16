'use client';

import { useEffect, useMemo, useState } from 'react';

type ChangeRequest = {
  id: string;
  title: string;
  description: string;
  environment: string;
  severity: string;
  status: string;
  risk_score: number;
  owner: string;
  approver: string;
  created_at: string;
  updated_at: string;
  deployment_status: string;
  rollback_status: string;
};

type AuditEvent = {
  id: string;
  change_id: string;
  action: string;
  details: string;
  user: string;
  created_at: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const extractAppAndVersion = (title: string): { app: string; version: string } => {
  const match = title.match(/Deploy\s+([a-z0-9\-]+)\s+(?:v)?(\d+\.\d+\.\d+|\d+\.\d+)/i);
  if (match) {
    return { app: match[1], version: match[2] };
  }
  return { app: 'Unknown', version: 'Unknown' };
};

const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'pending approval':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'scheduled':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'deployed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'deploying':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'rolled back':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStatusIcon = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'deployed':
    case 'completed':
      return '✓';
    case 'scheduled':
      return '📅';
    case 'rejected':
    case 'failed':
      return '✕';
    case 'pending approval':
      return '⏳';
    case 'deploying':
      return '⟳';
    case 'rolled back':
      return '↺';
    default:
      return '○';
  }
};

export default function DeploymentMonitorPage() {
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [deploymentStatus, setDeploymentStatus] = useState<any>(null);

  const selectedChange = useMemo(
    () => changes.find((c) => c.id === selectedId),
    [changes, selectedId]
  );

  const timelineEvents = useMemo(
    () => selectedChange ? auditLogs.filter((log) => log.change_id === selectedChange.id) : [],
    [selectedChange, auditLogs]
  );

  const filteredChanges = useMemo(() => {
    if (filter === 'all') return changes;
    if (filter === 'pending') return changes.filter((c) => c.status === 'Pending Approval');
    if (filter === 'approved') return changes.filter((c) => c.status === 'Approved');
    if (filter === 'scheduled') return changes.filter((c) => c.deployment_status === 'Scheduled');
    if (filter === 'deployed') return changes.filter((c) => c.deployment_status === 'Completed');
    if (filter === 'rolled-back') return changes.filter((c) => c.rollback_status === 'Executed');
    if (filter === 'failed') return changes.filter((c) => c.status === 'Failed');
    return changes;
  }, [changes, filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [changesRes, auditRes] = await Promise.all([
        fetch(`${API_URL}/api/changes`),
        fetch(`${API_URL}/api/audit`),
      ]);

      if (!changesRes.ok || !auditRes.ok) throw new Error('Failed to fetch data');

      const changesData = await changesRes.json();
      const auditData = await auditRes.json();

      setChanges(changesData);
      setAuditLogs(auditData);

      if (!selectedId && changesData.length > 0) {
        setSelectedId(changesData[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
  
    return () => clearInterval(interval);
  }, []);
  
  const fetchDeploymentStatus = async (changeId: string) => {
    try {
      const res = await fetch(
        `${API_URL}/api/changes/${changeId}/deployment-status`
      );
  
      if (!res.ok) return;
  
      const data = await res.json();
      setDeploymentStatus(data);
    } catch (err) {
      console.error(err);
    }
  };
  
  useEffect(() => {
    if (!selectedChange) return;
  
    fetchDeploymentStatus(selectedChange.id);
  
    const statusInterval = setInterval(() => {
      fetchDeploymentStatus(selectedChange.id);
    }, 1000);
  
    return () => clearInterval(statusInterval);
  }, [selectedChange]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Deployment Monitor</h1>
          <p className="text-slate-300">Track all deployments with real-time status updates</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {['all', 'pending', 'approved','scheduled', 'deployed', 'rolled-back', 'failed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Changes List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-700 rounded-lg border border-slate-600 overflow-hidden sticky top-8">
              <div className="bg-slate-800 px-6 py-4 border-b border-slate-600">
                <h2 className="text-lg font-semibold text-white">Deployments</h2>
                <p className="text-sm text-slate-400">{filteredChanges.length} total</p>
              </div>

              <div className="max-h-screen overflow-y-auto divide-y divide-slate-600">
                {filteredChanges.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">No deployments</div>
                ) : (
                  filteredChanges.map((change) => {
                    const { app, version } = extractAppAndVersion(change.title);
                    return (
                      <button
                        key={change.id}
                        onClick={() => setSelectedId(change.id)}
                        className={`w-full text-left p-4 transition-colors border-l-4 ${
                          selectedId === change.id
                            ? 'bg-blue-600 bg-opacity-30 border-l-blue-400'
                            : 'hover:bg-slate-600 border-l-transparent'
                        }`}
                      >
                        <p className="font-mono font-semibold text-cyan-300 text-sm">{change.id}</p>
                        <p className="text-xs text-slate-300 truncate mt-1">{app}</p>
                        <p className="text-xs text-slate-400">v{version}</p>
                        <div className="mt-2 flex gap-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getStatusColor(change.status)}`}>
                            {getStatusIcon(change.status)} {change.status}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-3 space-y-6">
            {selectedChange ? (
              <>
                {/* Summary Card */}
                <div className="bg-slate-700 rounded-lg border border-slate-600 p-6">
                  {/* Header */}
                  <div className="mb-6 pb-6 border-b border-slate-600">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-sm text-slate-400 uppercase tracking-wide mb-1">Ticket Number</p>
                        <p className="text-3xl font-bold text-cyan-300 font-mono">{selectedChange.id}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-lg text-sm font-semibold border ${getStatusColor(selectedChange.severity)}`}>
                        {selectedChange.severity} Severity
                      </span>
                    </div>
                    <h2 className="text-2xl font-semibold text-white">{selectedChange.title}</h2>
                    <p className="text-slate-400 mt-2">{selectedChange.description}</p>
                  </div>

                  {/* Status Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-slate-600">
                    {/* Application & Version */}
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Application</p>
                      <p className="text-white font-semibold">{extractAppAndVersion(selectedChange.title).app}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Version</p>
                      <p className="text-white font-semibold">v{extractAppAndVersion(selectedChange.title).version}</p>
                    </div>

                    {/* Statuses */}
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Approval Status</p>
                      <span className={`inline-flex px-3 py-1 rounded text-xs font-semibold border ${getStatusColor(selectedChange.status)}`}>
                        {getStatusIcon(selectedChange.status)} {selectedChange.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Deployment Status</p>
                      <span className={`inline-flex px-3 py-1 rounded text-xs font-semibold border ${getStatusColor(selectedChange.deployment_status)}`}>
                        {getStatusIcon(selectedChange.deployment_status)} {selectedChange.deployment_status}
                      </span>
                    </div>
                  </div>

                  {/* Rollback & Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Rollback Status</p>
                      <span className={`inline-flex px-3 py-1 rounded text-xs font-semibold border ${getStatusColor(selectedChange.rollback_status || 'Pending')}`}>
                        {getStatusIcon(selectedChange.rollback_status || 'Pending')} {selectedChange.rollback_status || 'Pending'}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Environment</p>
                      <p className="text-white font-semibold">{selectedChange.environment}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Risk Score</p>
                      <p className="text-white font-semibold">{selectedChange.risk_score}/100</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Owner</p>
                      <p className="text-white font-semibold">{selectedChange.owner}</p>
                    </div>
                  </div>
                </div>

                {deploymentStatus && (
  <div className="bg-slate-700 rounded-lg border border-slate-600 p-6">
    <h3 className="text-xl font-semibold text-white mb-6">
      Jenkins Pipeline View
    </h3>

    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-slate-300">Overall Progress</span>

        <span className="text-cyan-300 font-bold">
          {deploymentStatus.progress}%
        </span>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-5">
        <div
          className="bg-gradient-to-r from-blue-500 to-green-500 h-5 rounded-full transition-all duration-1000"
          style={{
            width: `${deploymentStatus.progress}%`,
          }}
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {deploymentStatus.stages?.map(
        (stage: any, index: number) => (
          <div
            key={index}
            className={`p-4 rounded-lg border text-center ${
              stage.status === 'Completed'
                ? 'bg-green-900/30 border-green-500'
                : stage.status === 'Running'
                ? 'bg-blue-900/30 border-blue-500'
                : stage.status === 'Failed'
                ? 'bg-red-900/30 border-red-500'
                : 'bg-slate-800 border-slate-600'
            }`}
          >
            <div className="text-2xl mb-2">
              {stage.status === 'Completed'
                ? '✅'
                : stage.status === 'Running'
                ? '🔄'
                : stage.status === 'Failed'
                ? '❌'
                : '⏳'}
            </div>

            <div className="font-semibold text-white">
              {stage.name}
            </div>

            <div className="text-sm text-slate-300 mt-2">
              {stage.status}
            </div>

            <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
              <div
                className={`h-2 rounded-full ${
                  stage.status === 'Completed'
                    ? 'bg-green-500'
                    : stage.status === 'Running'
                    ? 'bg-blue-500'
                    : stage.status === 'Failed'
                    ? 'bg-red-500'
                    : 'bg-gray-500'
                }`}
                style={{
                  width: `${stage.progress}%`,
                }}
              />
            </div>

            <div className="text-xs text-slate-400 mt-2">
              {stage.progress}%
            </div>
          </div>
        )
      )}
    </div>

    <div className="mt-6 p-4 bg-slate-800 rounded-lg">
      <div className="flex justify-between items-center">
        <span className="text-slate-300">
          Deployment Status
        </span>

        <span className="text-green-400 font-bold">
          {deploymentStatus.status}
        </span>
      </div>
    </div>
  </div>
)}

                {/* Timeline Events */}
                <div className="bg-slate-700 rounded-lg border border-slate-600 p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Timeline Events</h3>

                  {timelineEvents.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No events yet</p>
                  ) : (
                    <div className="space-y-4">
                      {timelineEvents.map((event, idx) => (
                        <div key={event.id} className="flex gap-4">
                          {/* Timeline dot and line */}
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-cyan-400 rounded-full border-2 border-slate-600 mb-4" />
                            {idx < timelineEvents.length - 1 && (
                              <div className="w-0.5 h-12 bg-slate-600 mb-4" />
                            )}
                          </div>

                          {/* Event content */}
                          <div className="flex-1 pb-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-white">{event.action}</p>
                                <p className="text-sm text-slate-300 mt-1">{event.details}</p>
                              </div>
                              <span className="text-xs text-slate-400 whitespace-nowrap">
                                {new Date(event.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                              by <span className="text-slate-400">{event.user}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="bg-slate-700 rounded-lg border border-slate-600 p-6 text-sm text-slate-300">
                  <p>
                    <span className="text-slate-400">Created:</span>{' '}
                    {new Date(selectedChange.created_at).toLocaleString()}
                  </p>
                  <p>
                    <span className="text-slate-400">Last Updated:</span>{' '}
                    {new Date(selectedChange.updated_at).toLocaleString()}
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-slate-700 rounded-lg border border-slate-600 p-12 text-center">
                <p className="text-slate-400">Select a deployment to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
