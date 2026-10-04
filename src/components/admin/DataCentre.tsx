import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  ShieldCheck,
  History,
  FileText,
  CheckCircle,
  AlertCircle,
  FileCode,
  HardDrive,
} from 'lucide-react';
import { db } from '../../services/db';
import { User } from '../../types';

interface DataCentreProps {
  currentUser: User;
}

export const DataCentre: React.FC<DataCentreProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'audit' | 'documents'>('backup');
  const [restoreJson, setRestoreJson] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const auditLogs = db.getAuditLogs();
  const parties = db.getParties();
  const products = db.getProducts();
  const orders = db.getOrders();
  const payments = db.getPayments();
  const expenses = db.getExpenses();

  const handleDownloadBackup = () => {
    const jsonStr = db.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kapila_Medical_Agencies_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Database snapshot successfully downloaded to local device!');
  };

  const handleRestoreBackup = () => {
    if (!restoreJson.trim()) {
      alert('Please paste the JSON backup content first.');
      return;
    }
    if (confirm('Are you sure you want to restore the database? Current tables will be replaced by the backup snapshot.')) {
      const res = db.restoreBackupJson(restoreJson, currentUser);
      setStatusMessage(res.message);
      if (res.success) setRestoreJson('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setRestoreJson(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
            System Infrastructure & Security
          </span>
          <h1 className="text-xl font-bold text-slate-900">Database & Security Data Centre</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full database snapshots, automatic audit trail logging, and regulatory document management
          </p>
        </div>

        <button
          onClick={handleDownloadBackup}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
        >
          <Download className="w-4 h-4" />
          <span>Download JSON Snapshot</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center space-x-2 font-semibold">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl text-xs font-bold space-x-1">
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 ${
            activeTab === 'backup'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Database Snapshot & Restore</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 ${
            activeTab === 'audit'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Trail ({auditLogs.length} Events)</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 ${
            activeTab === 'documents'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Document Vault</span>
        </button>
      </div>

      {/* BACKUP & RESTORE TAB */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Health Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2.5 text-sky-700 font-bold text-sm">
              <Database className="w-5 h-5" />
              <span>Current Database Schema Metrics</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Registered Parties</span>
                <span className="font-bold text-slate-900 text-sm">{parties.length} Chemists/Hospitals</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Product Lines</span>
                <span className="font-bold text-slate-900 text-sm">{products.length} Formulations</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Orders Booked</span>
                <span className="font-bold text-slate-900 text-sm">{orders.length} Invoices</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Collections & Receipts</span>
                <span className="font-bold text-slate-900 text-sm">{payments.length} Payments</span>
              </div>
            </div>

            <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 text-xs text-sky-900 space-y-1">
              <p><strong>Storage Engine:</strong> Relational Local State with IndexedDB / Cloud Replication</p>
              <p><strong>Location:</strong> Court Road, Sirsi – 581401</p>
              <p><strong>GSTIN Master:</strong> 29AABFK9897N1Z7</p>
            </div>
          </div>

          {/* Restore Snapshot Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-sm">
              <Upload className="w-5 h-5 text-indigo-600" />
              <span>Restore Database from Backup</span>
            </div>

            <p className="text-xs text-slate-500">
              Select a previously exported <code>.json</code> backup file or paste its content below to restore all tables.
            </p>

            <div>
              <label className="inline-block px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer border border-slate-300">
                <span>Browse JSON File</span>
                <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>

            <textarea
              rows={4}
              value={restoreJson}
              onChange={(e) => setRestoreJson(e.target.value)}
              placeholder="Paste JSON database snapshot content here..."
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              onClick={handleRestoreBackup}
              disabled={!restoreJson.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition shadow-xs"
            >
              Restore Database Snapshot
            </button>
          </div>
        </div>
      )}

      {/* AUDIT TRAIL TAB (Section 34) */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 text-xs">
            <span className="font-bold text-slate-800">Immutable Audit Trail Log</span>
            <span className="text-slate-500">Every authorization, rate change & entry recorded</span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User & Role</th>
                  <th className="p-3">Action Performed</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Details / Value Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{log.userName}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{log.role}</span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{log.action}</td>
                    <td className="p-3 font-mono text-slate-600">{log.entityType} ({log.entityId})</td>
                    <td className="p-3 text-slate-500 text-[11px] font-mono">
                      {log.newValue ? JSON.stringify(log.newValue).substring(0, 80) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOCUMENTS VAULT TAB (Section 22) */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-sky-700 font-bold text-sm">
              <FileText className="w-4 h-4" />
              <span>Drug Licences (KA D.L.)</span>
            </div>
            <p className="text-xs text-slate-500">Retail & Wholesale licences Form 20B / 21B under inspection</p>
            <span className="text-lg font-black text-slate-900 block">6 Licences Verified</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
              <FileText className="w-4 h-4" />
              <span>GST Registration Certificates</span>
            </div>
            <p className="text-xs text-slate-500">GST Form REG-06 for 29-series Karnataka registrations</p>
            <span className="text-lg font-black text-slate-900 block">6 Parties Documented</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-amber-700 font-bold text-sm">
              <FileText className="w-4 h-4" />
              <span>Cheque Instrument Photos</span>
            </div>
            <p className="text-xs text-slate-500">Photographs of received cheques for bank deposit reconciliation</p>
            <span className="text-lg font-black text-slate-900 block">
              {payments.filter((p) => p.mode === 'CHEQUE').length} Cheques Audited
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
