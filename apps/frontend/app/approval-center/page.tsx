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

  deployment_status?: string;
  rollback_status?: string;

  scheduled_date?: string;
  scheduled_time?: string;
  scheduled_deployment_at?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ApprovalCenterPage() {
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('Loading approval requests...');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');
  const [simulateFailure, setSimulateFailure] = useState(false);

  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [deploymentStatus, setDeploymentStatus] = useState('');
  const [deploymentStages, setDeploymentStages] = useState<any[]>([]);

  const pendingChanges = useMemo(
    () => changes.filter((c) => c.status === 'Pending Approval'),
    [changes]
  );

  const selectedChange = useMemo(
    () => pendingChanges.find((c) => c.id === selectedId) ?? pendingChanges[0],
    [pendingChanges, selectedId]
  );

  const refreshChanges = async () => {
    try {
      const res = await fetch(`${API_URL}/api/changes`);
      if (!res.ok) throw new Error('Failed to fetch changes');
      const data = await res.json();
      setChanges(data);
      if (!selectedId && data.length > 0) {
        setSelectedId(data.find((c: ChangeRequest) => c.status === 'Pending Approval')?.id || data[0].id);
      }
    } catch (err) {
      setMessageType('error');
      setMessage(err instanceof Error ? err.message : 'Failed to load changes');
    }
  };

  useEffect(() => {
    refreshChanges();
  }, []);

  const handleApprove = async () => {
    if (!selectedChange) return;
    setLoading(true);
    setMessageType('info');
    setMessage('Processing approval...');

    try {
      // Step 1: Approve the change
      const approveRes = await fetch(`${API_URL}/api/changes/${selectedChange.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approver: 'Approval Center',
          comments: 'Approved via Approval Center dashboard.',
        }),
      });

      if (!approveRes.ok) throw new Error('Failed to approve change');
      await approveRes.json();

      setMessageType('success');
      setMessage(`Change ${selectedChange.id} approved! Starting deployment...`);

      // Step 2: Auto-start deployment
      setTimeout(async () => {
        try {
          if (
            selectedChange.environment === 'Production' &&
            selectedChange.scheduled_date &&
            selectedChange.scheduled_time
          ) {
          
            setMessageType('success');
          
            setMessage(
              `Production deployment scheduled for ${selectedChange.scheduled_date} ${selectedChange.scheduled_time}`
            );
          
            setLoading(false);
          
            setTimeout(() => {
              refreshChanges();
            }, 1000);
          
            return;
          }
          const deployRes = await fetch(`${API_URL}/api/changes/${selectedChange.id}/simulate-deploy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: 'Approval Center', simulateFailure }),
          });

          if (!deployRes.ok) throw new Error('Failed to start deployment');
          const deployData = await deployRes.json();

          setMessageType('success');

          if (simulateFailure) {
            setMessage(
              `Deployment started (Failure Mode) for ${selectedChange.id}. Health Check will fail, auto-rollback enabled.`
            );
          } else {
            const deploymentId = deployData.data.id;
            setMessage(`Deployment started for ${selectedChange.id}. ID: ${deploymentId}`);

            const pollInterval = setInterval(async () => {
              try {
                const statusRes = await fetch(`${API_URL}/api/deployments/${deploymentId}/status`);
                const statusData = await statusRes.json();

                setDeploymentProgress(statusData.progress || 0);
                setDeploymentStatus(statusData.status || '');
                setDeploymentStages(Array.isArray(statusData.stages) ? statusData.stages : []);

                if (
                  statusData.status === 'Completed' ||
                  statusData.status === 'Failed' ||
                  statusData.status === 'Rolled Back'
                ) {
                  clearInterval(pollInterval);
                  refreshChanges();
                }
              } catch (err) {
                console.error(err);
              }
            }, 1000);
          }

          setTimeout(() => {
            refreshChanges();
          }, 1000);
        } catch (deployErr) {
          setMessageType('error');
          setMessage(deployErr instanceof Error ? deployErr.message : 'Failed to start deployment');
        } finally {
          setLoading(false);
        }
      }, 1000);
    } catch (err) {
      setMessageType('error');
      setMessage(err instanceof Error ? err.message : 'Approval failed');
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedChange) return;
    setLoading(true);
    setMessageType('info');
    setMessage('Processing rejection...');

    try {
      const res = await fetch(`${API_URL}/api/changes/${selectedChange.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approver: 'Approval Center',
          comments: 'Rejected via Approval Center dashboard. Further review required.',
        }),
      });

      if (!res.ok) throw new Error('Failed to reject change');

      setMessageType('success');
      setMessage(`Change ${selectedChange.id} rejected successfully.`);

      setTimeout(() => {
        refreshChanges();
      }, 1000);
    } catch (err) {
      setMessageType('error');
      setMessage(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Approval Center</h1>
          <p className="text-slate-300">Review and approve pending deployment changes</p>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              messageType === 'success'
                ? 'bg-green-900 text-green-100 border-green-600'
                : messageType === 'error'
                ? 'bg-red-900 text-red-100 border-red-600'
                : 'bg-blue-900 text-blue-100 border-blue-600'
            }`}
          >
            {message}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Changes List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-700 rounded-lg border border-slate-600 overflow-hidden">
              <div className="bg-slate-800 px-6 py-4 border-b border-slate-600">
                <h2 className="text-lg font-semibold text-white">Pending Approvals</h2>
                <p className="text-sm text-slate-400">
                  {pendingChanges.length} {pendingChanges.length === 1 ? 'change' : 'changes'}
                </p>
              </div>

              <div className="divide-y divide-slate-600 max-h-96 overflow-y-auto">
                {pendingChanges.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    No pending approvals
                  </div>
                ) : (
                  pendingChanges.map((change) => (
                    <button
                      key={change.id}
                      onClick={() => setSelectedId(change.id)}
                      className={`w-full text-left p-4 transition-colors ${
                        selectedId === change.id
                          ? 'bg-blue-600 bg-opacity-30 border-l-4 border-blue-400'
                          : 'hover:bg-slate-600 bg-opacity-20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-white text-sm">{change.id}</p>
                          <p className="text-xs text-slate-300 truncate mt-1">{change.title}</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold border flex-shrink-0 ${getSeverityColor(
                            change.severity
                          )}`}
                        >
                          {change.severity}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Change Details & Action Buttons */}
          <div className="lg:col-span-2">
            {selectedChange ? (
              <div className="bg-slate-700 rounded-lg border border-slate-600 p-6">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm text-slate-400 uppercase tracking-wide mb-1">Change ID</p>
                      <p className="text-2xl font-bold text-white">{selectedChange.id}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-sm font-semibold border ${getSeverityColor(
                        selectedChange.severity
                      )}`}
                    >
                      {selectedChange.severity} Severity
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold text-white mb-2">{selectedChange.title}</h2>
                  <p className="text-slate-300">{selectedChange.description}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-600">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Owner</p>
                    <p className="text-white font-semibold">{selectedChange.owner}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Environment</p>
                    <p className="text-white font-semibold">{selectedChange.environment}</p>
                  </div>
                  {/* <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Risk Score</p>
                    <p className="text-white font-semibold">{selectedChange.risk_score}/100</p>
                  </div> */}
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Created</p>
                    <p className="text-white font-semibold text-sm">
                      {new Date(selectedChange.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Simulate Failure Checkbox */}
                <div className="mb-6 pb-6 border-b border-slate-600">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                      disabled={loading}
                      className="w-5 h-5 accent-red-600 cursor-pointer"
                    />
                    <div>
                      <p className="text-white font-semibold">Simulate Failure</p>
                      <p className="text-xs text-slate-400">
                        Health Check will fail, triggering automatic rollback
                      </p>
                    </div>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {loading ? 'Processing...' : '✓ Approve & Deploy'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {loading ? 'Processing...' : '✕ Reject'}
                  </button>
                </div>

                {/* Info Box */}
                <div className={`mt-6 p-4 rounded-lg border ${
                  simulateFailure
                    ? 'bg-red-900 bg-opacity-30 border-red-600'
                    : 'bg-blue-900 bg-opacity-30 border-blue-600'
                }`}>
                  <p className={simulateFailure ? 'text-red-100 text-sm' : 'text-blue-100 text-sm'}>
                    <strong>Note:</strong> {simulateFailure 
                      ? 'Failure Mode Enabled: Checkout → Build (✓) → Test (✓) → Deploy (✓) → Health Check (✗ FAILED). Auto-rollback will execute after failure.'
                      : 'Approving this change will automatically start the deployment pipeline. The deployment will go through 5 stages: Checkout, Build, Test, Deploy, and Health Check.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-700 rounded-lg border border-slate-600 p-12 text-center">
                <p className="text-slate-400">No pending changes to review</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}