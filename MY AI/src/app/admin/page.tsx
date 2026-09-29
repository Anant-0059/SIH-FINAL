"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Users,
  Cpu,
  HardDrive,
  Activity,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Trash2,
} from "lucide-react";

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const loadState = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workspace");
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleUserStatus = async (userId: string, status: string) => {
    await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "admin_update_user_status",
        userId,
        status,
      }),
    });
    notify(`Updated user state to ${status}`);
    loadState();
  };

  const handleToggleProvider = async (
    providerId: string,
    enabled: boolean,
    healthStatus?: string
  ) => {
    await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_provider_state",
        providerId,
        enabled,
        healthStatus,
      }),
    });
    notify(`Updated provider ${providerId}`);
    loadState();
  };

  const handleCleanup = async () => {
    const res = await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cleanup_storage" }),
    });
    const json = await res.json();
    notify(`Reclaimed ${json.reclaimedMb || 0} MB of cache & temporary files.`);
    loadState();
  };

  if (loading || !data?.state) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">
            Loading AVRENYX /admin Governance Console...
          </p>
        </div>
      </div>
    );
  }

  const { state, hardware } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-sky-500/20 border border-sky-400/50 text-sky-100 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md text-sm">
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                AVRENYX /admin — Security & System Governance
              </h1>
              <p className="text-xs text-slate-400">
                RBAC Protected • Argon2id/PBKDF2 Verified • Plaintext User API
                Keys Strictly Hidden (Rule 86)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadState}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
            </button>
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Workspace
            </Link>
          </div>
        </div>

        {/* Hardware & System Resource Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky-400" /> Registered Users
            </div>
            <div className="text-2xl font-bold mt-1">{state.users.length}</div>
            <div className="text-[11px] text-emerald-400 mt-1">
              Google OAuth 2.0 + RBAC Active
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-400" /> System Hardware
            </div>
            <div className="text-2xl font-bold mt-1">
              {hardware.cpuCores} Cores • {hardware.freeRamGb} GB Free
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Total RAM: {hardware.totalRamGb} GB
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-amber-400" /> Total Storage
            </div>
            <div className="text-2xl font-bold mt-1">
              {state.storage.totalGb} GB
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Local AI Models: {state.storage.localAiModelsGb} GB (Separated)
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-purple-400" /> Non-Negotiable Policy
            </div>
            <div className="text-sm font-semibold text-emerald-400 mt-1.5">
              ✓ 0 Subscriptions • 0 Ads • 0 Coins
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Smart Cost Guard Enforced
            </div>
          </div>
        </div>

        {/* User Approvals & RBAC State */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" /> User Approvals & Account
            States (PENDING / ACTIVE / DISABLED / SUSPENDED)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2">Name & Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Routing Policy</th>
                  <th className="py-2">Current State</th>
                  <th className="py-2">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {state.users.map((u: any) => (
                  <tr key={u.id}>
                    <td className="py-2.5">
                      <div className="font-medium text-slate-200">{u.name}</div>
                      <div className="text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-300">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300">{u.routingPolicy}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : u.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2.5 space-x-1.5">
                      {(["ACTIVE", "PENDING", "DISABLED", "SUSPENDED"] as const).map(
                        (st) => (
                          <button
                            key={st}
                            onClick={() => handleUserStatus(u.id, st)}
                            className={`px-2 py-1 rounded border text-[11px] ${
                              u.status === st
                                ? "border-sky-500 bg-sky-500/20 text-sky-200"
                                : "border-slate-700 hover:border-slate-600 text-slate-400"
                            }`}
                          >
                            {st}
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Provider Health & Admin Provider Controls */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Multi-AI Provider
            Control & Real-Time Health Monitor
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {state.providers.map((p: any) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-xs text-slate-100">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Tier: <span className="text-sky-300">{p.billingTier}</span>{" "}
                      • Latency: {p.latencyMs}ms
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      p.healthStatus === "AVAILABLE" || p.healthStatus === "LOCAL"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : p.healthStatus === "QUOTA_REACHED"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {p.healthStatus}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Private BYOK Key:{" "}
                  {p.maskedApiKey ? (
                    <span className="text-emerald-400 font-mono">
                      {p.maskedApiKey} (Encrypted)
                    </span>
                  ) : (
                    "Not Stored"
                  )}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => handleToggleProvider(p.id, !p.enabled)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                      p.enabled
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {p.enabled ? "Enabled" : "Disabled"}
                  </button>
                  <button
                    onClick={() =>
                      handleToggleProvider(
                        p.id,
                        p.enabled,
                        p.healthStatus === "QUOTA_REACHED"
                          ? "AVAILABLE"
                          : "QUOTA_REACHED"
                      )
                    }
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300"
                  >
                    Simulate Quota Toggle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Storage Cleanup & Security Audit Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-amber-400" /> Storage
                Dashboard & Smart Data Cleanup
              </h2>
              <button
                onClick={handleCleanup}
                className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Confirm Safe Cleanup
              </button>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Documents</span>
                <span className="font-mono">{state.storage.documentsGb} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Projects</span>
                <span className="font-mono">{state.storage.projectsGb} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Images</span>
                <span className="font-mono">{state.storage.imagesGb} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Artifacts</span>
                <span className="font-mono">{state.storage.artifactsGb} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cache (Reclaimable)</span>
                <span className="font-mono text-amber-300">
                  {state.storage.cacheGb} GB
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5">
                <span className="text-sky-300">
                  Local AI Models (Separated)
                </span>
                <span className="font-mono text-sky-300">
                  {state.storage.localAiModelsGb} GB
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1">
                <span>Total</span>
                <span>{state.storage.totalGb} GB</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" /> Immutable Security
              Audit Log (No Secrets Logged)
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {state.auditLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-sky-300">
                      [{log.category}] {log.action}
                    </span>
                    <span>{log.timestamp.slice(0, 19).replace("T", " ")}</span>
                  </div>
                  <p className="text-slate-300 mt-1">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
