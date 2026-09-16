'use client';

import { useState } from 'react';

type ParsedCommand = {
  application?: string;
  version?: string;
  environment?: string;
};

type ChangeRequest = {
  id: string;
  title: string;
  status: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function CreateDeploymentPage() {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedCommand | null>(null);
  const [changeRequest, setChangeRequest] = useState<ChangeRequest | null>(null);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');
  const [parseSource, setParseSource] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const handleParseAndCreate = async () => {
    if (!command.trim()) {
      setMessageType('error');
      setMessage('Please enter a deployment command');
      return;
    }

    setLoading(true);
    setMessage('Parsing command...');
    setMessageType('info');
    setParsed(null);
    setChangeRequest(null);

    try {
      const res = await fetch(`${API_URL}/api/parse-deployment-command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: command.trim(), user: 'Frontend User' }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to parse command');
      }

      const data = await res.json();

      setParseSource(data.parseSource);
      setParsed(data.parsed);
      setChangeRequest(data.changeRequest);
      setMessageType('success');
      setMessage(`✓ Deployment request created successfully! (Parsed with ${data.parseSource})`);

     // Clear input after success
      setTimeout(() => {
        setCommand('');
      }, 1000);
    } catch (err) {
      setMessageType('error');
      setMessage(err instanceof Error ? err.message : 'Failed to process command');
      setParsed(null);
      setChangeRequest(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setCommand(example);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Create Deployment</h1>
          <p className="text-slate-300">Use natural language to create deployment requests with AI parsing</p>
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-2 bg-slate-700 rounded-lg border border-slate-600 p-6">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-3">
                Deployment Command
              </label>
              <textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="E.g., Deploy inventory-api 1.2.0 to Dev"
                className="w-full bg-slate-800 border border-slate-500 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                rows={5}
                disabled={loading}
              />
            </div>

            {/* Example Commands */}
            <div className="mb-6 pb-6 border-b border-slate-600">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Try these examples:
              </p>
              <div className="space-y-2">
                {[
                  'Deploy inventory-api 1.2.0 to Dev',
                  'Deploy payment-service 2.3.1 to Staging',
                  'Deploy frontend 3.0.0 to Production',
                ].map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(example)}
                    className="block w-full text-left px-3 py-2 bg-slate-600 hover:bg-slate-500 text-slate-100 rounded text-sm transition-colors"
                  >
                    → {example}
                  </button>
                ))}
              </div>
            </div>

            {parsed?.environment?.toLowerCase() === 'production' && (
  <div className="mb-6 p-4 rounded-lg border border-orange-500 bg-orange-900/20">

    <h4 className="text-white font-semibold mb-4">
      Production Deployment Schedule
    </h4>

    <div className="grid grid-cols-2 gap-4">

      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Deployment Date
        </label>

        <input
          type="date"
          value={scheduledDate}
          onChange={(e) =>
            setScheduledDate(e.target.value)
          }
          className="w-full bg-slate-800 border border-slate-500 rounded-lg px-3 py-2 text-white"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Deployment Time
        </label>

        <input
          type="time"
          value={scheduledTime}
          onChange={(e) =>
            setScheduledTime(e.target.value)
          }
          className="w-full bg-slate-800 border border-slate-500 rounded-lg px-3 py-2 text-white"
        />
      </div>

    </div>

  </div>
)}

            {/* Action Buttons */}
            {/* Action Buttons */}

<button
  onClick={handleParseAndCreate}
  disabled={loading}
  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
>
  {loading ? 'Processing...' : '→ Parse & Create Deployment'}
</button>

{/* Production Schedule Save Button */}

{parsed?.environment?.toLowerCase() ===
  'production' &&
  changeRequest && (
    <button
      onClick={async () => {

        await fetch(
          `${API_URL}/api/changes/${changeRequest.id}/schedule`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify({
              scheduled_date:
                scheduledDate,
              scheduled_time:
                scheduledTime
            })
          }
        );

        setMessage(
          'Production deployment scheduled successfully'
        );

      }}
      className="mt-4 w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg"
    >
      Save Production Schedule
    </button>
)}
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            {/* Parsed Data */}
            {parsed && (
              <div className="bg-slate-700 rounded-lg border border-slate-600 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Parsed Information</h3>
                <div className="space-y-3 text-sm">
                  {parsed.application && (
                    <div>
                      <p className="text-slate-400 uppercase tracking-wide text-xs mb-1">Application</p>
                      <p className="text-white font-semibold">{parsed.application}</p>
                    </div>
                  )}
                  {parsed.version && (
                    <div>
                      <p className="text-slate-400 uppercase tracking-wide text-xs mb-1">Version</p>
                      <p className="text-white font-semibold">{parsed.version}</p>
                    </div>
                  )}
                  {parsed.environment && (
                    <div>
                      <p className="text-slate-400 uppercase tracking-wide text-xs mb-1">Environment</p>
                      <p className="text-white font-semibold">{parsed.environment}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <p className="text-xs text-slate-400">Parsed with: <span className="text-blue-300 font-semibold">{parseSource}</span></p>
                </div>
              </div>
            )}

            {/* Change Request Summary */}
            {changeRequest && (
              <div className="bg-green-900 bg-opacity-30 rounded-lg border border-green-600 p-6">
                <h3 className="text-lg font-semibold text-green-100 mb-4">✓ Request Created</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-green-200 uppercase tracking-wide text-xs mb-1">Change ID</p>
                    <p className="text-white font-mono font-semibold">{changeRequest.id}</p>
                  </div>
                  <div>
                    <p className="text-green-200 uppercase tracking-wide text-xs mb-1">Title</p>
                    <p className="text-white text-sm">{changeRequest.title}</p>
                  </div>
                  <div>
                    <p className="text-green-200 uppercase tracking-wide text-xs mb-1">Status</p>
                    <p className="text-white font-semibold">{changeRequest.status}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-900 bg-opacity-30 rounded-lg border border-blue-600 p-6">
              <h4 className="text-sm font-semibold text-blue-100 mb-2">💡 How it works</h4>
              <p className="text-xs text-blue-100 leading-relaxed">
                Type a deployment command in natural language. The system uses OpenAI to extract the application name, version, and environment. A change request is created automatically and sent for approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

