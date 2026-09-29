"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Shield,
  Cpu,
  Layers,
  FileText,
  Search,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Key,
  Lock,
  Play,
  RotateCcw,
  BookOpen,
  Briefcase,
  Presentation,
  HardDrive,
  Command,
  Sun,
  Moon,
  Share2,
  Eye,
  Wand2,
  Wrench,
  History,
  Image as ImageIcon,
  Users,
  Mic,
  Sliders,
  ChevronRight,
  X,
} from "lucide-react";

type StudioTab =
  | "router"
  | "documents"
  | "research"
  | "council"
  | "workflows"
  | "student_resume"
  | "providers"
  | "privacy_storage";

export default function AvrenyxWorkspacePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StudioTab>("router");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [presentationFullscreen, setPresentationFullscreen] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Resizable Split-Screen Panel Widths (%)
  const [leftWidth, setLeftWidth] = useState(21);
  const [rightWidth, setRightWidth] = useState(29);

  // Studio Interactive States
  const [taskPrompt, setTaskPrompt] = useState(
    "Create a professional report on Resilient Multi-AI Routing, Zero-Subscription Governance, and Checkpoint Recovery"
  );
  const [taskCategory, setTaskCategory] = useState("document");
  const [simulateQuotaAt65, setSimulateQuotaAt65] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Research & Image State
  const [researchQuery, setResearchQuery] = useState(
    "Autonomous Multi-Model AI Routing and Provenance Standards"
  );
  const [citationStyle, setCitationStyle] = useState("APA");
  const [researchResult, setResearchResult] = useState<any>(null);
  const [visualAssets, setVisualAssets] = useState<any[]>([]);

  // Council State
  const [councilTopic, setCouncilTopic] = useState(
    "Designing a Sovereign Zero-Subscription AI Operating System with Local + BYOK Fallback"
  );
  const [councilOutput, setCouncilOutput] = useState<any>(null);

  // Knowledge Vault Search State
  const [vaultQuery, setVaultQuery] = useState(
    "What did I research about this project last month?"
  );
  const [vaultAnswer, setVaultAnswer] = useState<any>(null);

  // Document Diff & Preview State
  const [diffResult, setDiffResult] = useState<any>(null);
  const [voiceTranscript, setVoiceTranscript] = useState(
    "Take this PDF, summarize it, find missing information online and create a professional presentation."
  );

  // BYOK Input State
  const [selectedByokProvider, setSelectedByokProvider] = useState("gemini");
  const [byokKeyInput, setByokKeyInput] = useState("");
  const [byokAuthorizePaid, setByokAuthorizePaid] = useState(false);

  // Share Link Input State
  const [sharePassword, setSharePassword] = useState("");
  const [shareAllowDownload, setShareAllowDownload] = useState(false);

  // Student Mode & Resume Builder State
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(
    null
  );
  const [resumeRoleTarget, setResumeRoleTarget] = useState(
    "Principal AI Systems Architect"
  );

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  const fetchWorkspace = async () => {
    try {
      const res = await fetch("/api/workspace");
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

  // Universal Command Bar keyboard shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
        setPresentationFullscreen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const callWorkspaceAction = async (
    payload: Record<string, any>,
    successMsg?: string
  ) => {
    setBusyAction(payload.action);
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.state) {
        setData((prev: any) => ({ ...prev, state: json.state }));
      }
      if (successMsg) notify(successMsg);
      return json;
    } finally {
      setBusyAction(null);
    }
  };

  const handleRunDurableTask = async () => {
    const json = await callWorkspaceAction(
      {
        action: "run_durable_task",
        prompt: taskPrompt,
        taskType: taskCategory,
        simulateFailureAt65: simulateQuotaAt65,
      },
      simulateQuotaAt65
        ? "Task completed! Automatically checkpointed at 65% after Provider A quota & resumed on Provider B."
        : "Task executed and validated via Central AI Router."
    );
    if (json?.jobResult) {
      setActiveTab("router");
    }
  };

  const handleReplayStep = async (jobId: string, stepIndex: number) => {
    await callWorkspaceAction(
      {
        action: "replay_task_from_step",
        jobId,
        stepIndex,
      },
      `Replayed task from Step ${stepIndex} while preserving Steps 1–${stepIndex - 1}!`
    );
  };

  const handleMakeProfessional = async (artifactId: string) => {
    const json = await callWorkspaceAction(
      { action: "make_document_professional", artifactId },
      "One-Click Professional Mode applied! Version history & diff generated."
    );
    if (json?.diff) setDiffResult(json.diff);
  };

  const handleRepairDocument = async (artifactId: string) => {
    const json = await callWorkspaceAction(
      { action: "repair_document", artifactId },
      "Document repaired, re-validated, and saved as a new version!"
    );
    if (json?.diff) setDiffResult(json.diff);
  };

  const handleRunDeepResearch = async () => {
    const json = await callWorkspaceAction(
      {
        action: "run_deep_research",
        query: researchQuery,
        citationStyle,
      },
      `Deep Research & License-Verified Image Planning completed (${citationStyle} citations).`
    );
    if (json?.researchResult) setResearchResult(json.researchResult);
    if (json?.visuals) setVisualAssets(json.visuals);
  };

  const handleReplaceBrokenImage = async (asset: any) => {
    const json = await callWorkspaceAction(
      {
        action: "replace_broken_image",
        brokenAsset: asset,
        topic: researchQuery,
      },
      "Unavailable image automatically replaced with verified CC0 vector diagram!"
    );
    if (json?.replacedAsset) {
      setVisualAssets((prev) =>
        prev.map((v) => (v.id === asset.id ? json.replacedAsset : v))
      );
    }
  };

  const handleRunCouncil = async () => {
    const json = await callWorkspaceAction(
      { action: "run_ai_council", topic: councilTopic },
      "Multi-AI Council synthesis completed across 5 specialist roles!"
    );
    if (json?.councilResult) setCouncilOutput(json.councilResult);
  };

  const handleSearchVault = async () => {
    const json = await callWorkspaceAction(
      { action: "search_knowledge_vault", query: vaultQuery },
      "Searched Personal Knowledge Vault & Project Memory."
    );
    if (json?.vaultResult) setVaultAnswer(json.vaultResult);
  };

  if (loading || !data?.state) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-lg font-bold tracking-wider text-sky-400">
            AVRENYX
          </div>
          <p className="text-xs text-slate-400">
            Initializing Central AI Router, Smart Cost Guard & Checkpoint Engine...
          </p>
        </div>
      </div>
    );
  }

  const { state, hardware, ollamaProbe } = data;
  const activeArtifact = state.artifacts[0];
  const activeJob = state.jobs[0];

  const UNIVERSAL_COMMANDS = [
    {
      label: "Create report",
      desc: "Generate structured DOCX/PDF report with auto-fallback",
      run: () => {
        setActiveTab("router");
        setTaskCategory("document");
        setCommandOpen(false);
      },
    },
    {
      label: "Analyze this PDF",
      desc: "Run OCR, table extraction & Prompt Injection Guard",
      run: () => {
        setActiveTab("workflows");
        setCommandOpen(false);
      },
    },
    {
      label: "Make this professional",
      desc: "Run One-Click Professional Mode on active document",
      run: () => {
        setActiveTab("documents");
        handleMakeProfessional(activeArtifact.id);
        setCommandOpen(false);
      },
    },
    {
      label: "Research this topic",
      desc: "Deep Research + Conflict Detection + APA/MLA/IEEE citations",
      run: () => {
        setActiveTab("research");
        handleRunDeepResearch();
        setCommandOpen(false);
      },
    },
    {
      label: "Create presentation",
      desc: "Launch Presentation Mode & PPTX deck generator",
      run: () => {
        setPresentationFullscreen(true);
        setCommandOpen(false);
      },
    },
    {
      label: "Compare these documents",
      desc: "Open Multi-File Diff & Source Conflict Analyzer",
      run: () => {
        setActiveTab("documents");
        setCommandOpen(false);
      },
    },
    {
      label: "Build workflow",
      desc: "Visual AI Workflow Builder & Voice-to-Workflow compiler",
      run: () => {
        setActiveTab("workflows");
        setCommandOpen(false);
      },
    },
    {
      label: "Summarize project",
      desc: "Synthesize Project Memory & AI Council executive brief",
      run: () => {
        setActiveTab("council");
        handleRunCouncil();
        setCommandOpen(false);
      },
    },
    {
      label: "Find relevant images",
      desc: "Search Wikimedia Commons with Creative Commons verification",
      run: () => {
        setActiveTab("research");
        handleRunDeepResearch();
        setCommandOpen(false);
      },
    },
    {
      label: "Generate spreadsheet",
      desc: "Export multi-sheet XLSX workbook from current analysis",
      run: () => {
        window.open(`/api/export?format=XLSX&artifactId=${activeArtifact.id}`, "_blank");
        setCommandOpen(false);
      },
    },
    {
      label: "Continue previous task",
      desc: "Resume task from 65% durable checkpoint on fallback provider",
      run: () => {
        setActiveTab("router");
        handleReplayStep(activeJob.jobId, 4);
        setCommandOpen(false);
      },
    },
    {
      label: "Switch AI",
      desc: "Configure BYOK keys, Local Ollama & Routing Policy",
      run: () => {
        setActiveTab("providers");
        setCommandOpen(false);
      },
    },
    {
      label: "Search knowledge vault",
      desc: "Query semantic vault ('What did I research last month?')",
      run: () => {
        handleSearchVault();
        setCommandOpen(false);
      },
    },
  ];

  const filteredCommands = UNIVERSAL_COMMANDS.filter((c) =>
    `${c.label} ${c.desc}`.toLowerCase().includes(commandQuery.toLowerCase())
  );

  const slideDeck = [
    {
      title: "AVRENYX — Sovereign Multi-AI Operating Workspace",
      subtitle: "One Workspace. Every AI. Every Creation.",
      bullets: [
        "100% Free-First & Subscription-Free: Zero internal coins, credits, ads, or paywalls.",
        "Smart Cost Guard blocks unauthorized paid providers before any external API call is made.",
        "Unified capability-based routing across Local Ollama, Free API Tiers, and encrypted BYOK.",
      ],
      notes:
        "Welcome to Presentation Mode. Use Left/Right buttons to navigate slides.",
    },
    {
      title: "Automatic Provider Fallback & Durable 65% Checkpoints",
      subtitle: "Zero Lost Work When Quotas or Outages Occur",
      bullets: [
        "Real workflow progress tracked across 6 stages (18% -> 34% -> 48% -> 65% -> 85% -> 100%).",
        "When Provider A hits HTTP 429 at 65%, AVRENYX builds a compact Continuation Package.",
        "Provider B resumes immediately from 65% without restarting Steps 1–3.",
      ],
      notes:
        "Highlight that only task state transfers — never external credits or tokens.",
    },
    {
      title: "Deep Research, Conflict Detection & Verified Visuals",
      subtitle: "Traceable Provenance & Multi-Standard Citations",
      bullets: [
        "Queries legitimate open knowledge registries (Wikimedia, NIST, OWASP, W3C).",
        "Explicitly surfaces Source Conflicts when two publishers disagree.",
        "Formats bibliographies in APA, MLA, Chicago, IEEE, and Harvard standards.",
      ],
      notes:
        "Point out separate Research Sources vs. Licensed Image Sources in Artifact Lineage.",
    },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col ${
        theme === "dark"
          ? "bg-[#070b14] text-slate-100"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-sky-500/20 border border-sky-400/60 text-sky-100 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md text-xs flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Fullscreen Presentation Mode Modal (Rule 45) */}
      {presentationFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-10">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-sky-400 font-bold tracking-wider text-sm">
              <Presentation className="w-5 h-5" /> AVRENYX PRESENTATION MODE •
              SLIDE {activeSlideIndex + 1} OF {slideDeck.length}
            </div>
            <button
              onClick={() => setPresentationFullscreen(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Exit Presentation (Esc)
            </button>
          </div>

          <div className="max-w-4xl mx-auto w-full my-auto space-y-6 bg-slate-900/90 border border-slate-800 p-12 rounded-2xl shadow-2xl">
            <div className="text-xs uppercase tracking-widest text-sky-400 font-semibold">
              {slideDeck[activeSlideIndex].subtitle}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {slideDeck[activeSlideIndex].title}
            </h2>
            <ul className="space-y-4 text-lg text-slate-200 pt-2">
              {slideDeck[activeSlideIndex].bullets.map((b, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    {idx + 1}
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-4 border-t border-slate-800 text-xs text-slate-400">
              <strong className="text-slate-300">Speaker Notes:</strong>{" "}
              {slideDeck[activeSlideIndex].notes}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              disabled={activeSlideIndex === 0}
              onClick={() => setActiveSlideIndex((i) => Math.max(0, i - 1))}
              className="px-4 py-2 rounded-lg bg-slate-800 disabled:opacity-40 text-xs font-semibold"
            >
              ← Previous Slide
            </button>
            <div className="flex gap-2">
              {slideDeck.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`w-3 h-3 rounded-full ${
                    idx === activeSlideIndex ? "bg-sky-400" : "bg-slate-700"
                  }`}
                />
              ))}
            </div>
            <button
              disabled={activeSlideIndex === slideDeck.length - 1}
              onClick={() =>
                setActiveSlideIndex((i) => Math.min(slideDeck.length - 1, i + 1))
              }
              className="px-4 py-2 rounded-lg bg-sky-500 text-slate-950 disabled:opacity-40 text-xs font-semibold"
            >
              Next Slide →
            </button>
          </div>
        </div>
      )}

      {/* Universal AI Command Center (Ctrl/Cmd + K) (Rule 14) */}
      {commandOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
              <Command className="w-5 h-5 text-sky-400" />
              <input
                autoFocus
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Type a command (e.g. 'Create report', 'Research this topic', 'Continue previous task', 'Switch AI')..."
                className="w-full bg-transparent text-sm text-slate-100 focus:outline-none"
              />
              <button
                onClick={() => setCommandOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800"
              >
                ESC
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
              {filteredCommands.map((cmd, i) => (
                <button
                  key={i}
                  onClick={cmd.run}
                  className="w-full px-4 py-3 text-left hover:bg-sky-500/10 flex items-center justify-between transition"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-100">
                      {cmd.label}
                    </div>
                    <div className="text-[11px] text-slate-400">{cmd.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* First-Run Experience Wizard Modal (Rule 80) */}
      {onboardingOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold">
                  Welcome to AVRENYX — First-Run Configuration
                </h2>
              </div>
              <button
                onClick={() => setOnboardingOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              AVRENYX is strictly free-first and subscription-free. Configure
              your default AI routing, local execution, and Smart Cost Guard
              preferences below:
            </p>
            <div className="space-y-2.5 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span>1. Sign in with Google (OAuth 2.0 / OIDC)</span>
                <span className="text-emerald-400 font-semibold">
                  ✓ Connected ({state.currentUser.email})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>2. Automatic Provider Fallback & Checkpoints</span>
                <span className="text-sky-400 font-semibold">ON (Default)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>3. Paid Provider Usage (Smart Cost Guard)</span>
                <span className="text-emerald-400 font-semibold">
                  OFF (Blocked unless explicitly authorized)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>4. Local AI (Ollama) Priority</span>
                <span className="text-sky-400 font-semibold">
                  Preferred where hardware-capable ({hardware.freeRamGb} GB free
                  RAM)
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  callWorkspaceAction(
                    {
                      action: "complete_onboarding",
                      routingPolicy: "free-first",
                      allowPaidProviders: false,
                      localOnlyPrivacy: false,
                      autoFallbackEnabled: true,
                    },
                    "First-Run Setup saved! Free-First & Automatic Fallback active."
                  );
                  setOnboardingOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs"
              >
                Apply Recommended Free-First Defaults & Start Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top OS Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center font-black text-slate-950 text-sm shadow-lg shadow-sky-500/20">
            AV
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-sm">
                AVRENYX
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                100% Free-First • 0 Subscriptions
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              One Workspace. Every AI. Every Creation.
            </div>
          </div>
        </div>

        {/* Live Provider Health Monitor Ribbon (Rule 10) */}
        <div className="hidden xl:flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-[11px]">
          <span className="text-slate-400 font-medium">Provider Health:</span>
          {state.providers.slice(0, 6).map((p: any) => (
            <span
              key={p.id}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800"
              title={`${p.name} • ${p.billingTier} • ${p.latencyMs}ms`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  p.healthStatus === "LOCAL"
                    ? "bg-sky-400"
                    : p.isPaidProvider && !state.currentUser.allowPaidProviders
                    ? "bg-amber-400"
                    : p.healthStatus === "AVAILABLE"
                    ? "bg-emerald-400"
                    : "bg-rose-400"
                }`}
              />
              <span className="text-slate-200">{p.name.split(" ")[0]}</span>
              <span className="text-[10px] text-slate-400">
                {p.healthStatus === "LOCAL"
                  ? "Local"
                  : p.isPaidProvider && !state.currentUser.allowPaidProviders
                  ? "Cost Guard"
                  : p.healthStatus === "QUOTA_REACHED"
                  ? "Quota"
                  : "Avail"}
              </span>
            </span>
          ))}
        </div>

        {/* Command Bar Trigger & Top Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCommandOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 flex items-center gap-2"
          >
            <Command className="w-3.5 h-3.5 text-sky-400" />
            <span>Command Center</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-950 rounded border border-slate-700 text-slate-400">
              Ctrl+K
            </kbd>
          </button>

          <button
            onClick={() => setOnboardingOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300"
          >
            First-Run Setup
          </button>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Toggle Dark/Light Theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-sky-400" />
            )}
          </button>

          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" /> /admin
          </Link>
        </div>
      </header>

      {/* Secondary Privacy, Smart Cost Guard & Split-Screen Sizing Subbar */}
      <div className="border-b border-slate-800/70 bg-slate-900/60 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <Lock className="w-3.5 h-3.5" />
            {state.currentUser.localOnlyPrivacy
              ? "Processing: Local | Data sent externally: No"
              : `Processing: ${activeJob?.privacySummary?.processingModeLabel?.replace("Processing: ", "") || "Transparent Hybrid"} | Active Provider: ${activeJob?.finalProviderName || "Ollama / Gemini"}`}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-sky-300">
            Smart Cost Guard:{" "}
            {state.currentUser.allowPaidProviders
              ? "Paid Authorized Opt-In"
              : "Paid Providers Blocked (Free/Local/BYOK Only)"}
          </span>
        </div>

        {/* Split-Screen Resizer Controls (Rule 42) */}
        <div className="hidden lg:flex items-center gap-2 text-slate-400">
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          <span>Split-Screen Layout:</span>
          <button
            onClick={() => {
              setLeftWidth(20);
              setRightWidth(28);
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Balanced (20/52/28)
          </button>
          <button
            onClick={() => {
              setLeftWidth(16);
              setRightWidth(38);
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Wide Preview (16/46/38)
          </button>
        </div>
      </div>

      {/* Main 3-Pane Split-Screen Operating Workspace (Rule 42) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT PANE: Projects, Personal Knowledge Vault & Project Memory */}
        <aside
          style={{ width: `${leftWidth}%` }}
          className="w-full lg:w-auto border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-950/60 p-4 overflow-y-auto space-y-5 shrink-0"
        >
          {/* Active Projects */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Projects ({state.projects.length})</span>
              <span className="text-emerald-400 text-[10px]">No Limits</span>
            </div>
            <div className="space-y-1.5">
              {state.projects.map((proj: any) => (
                <div
                  key={proj.id}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    proj.id === state.activeProjectId
                      ? "bg-sky-500/15 border-sky-500/40 text-slate-100"
                      : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="font-semibold">{proj.name}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                    {proj.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Personal Knowledge Vault Semantic Query (Rule 27) */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Personal Knowledge Vault
            </div>
            <div className="space-y-1.5">
              <input
                value={vaultQuery}
                onChange={(e) => setVaultQuery(e.target.value)}
                placeholder="Ask e.g. What did I research last month?"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100"
              />
              <button
                onClick={handleSearchVault}
                className="w-full py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-semibold"
              >
                Query Knowledge Vault
              </button>
            </div>
            {vaultAnswer && (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-sky-500/30 text-[11px] text-slate-200 space-y-1">
                <div className="font-semibold text-sky-300">
                  Vault Recall Result:
                </div>
                {vaultAnswer.matchedItems.map((it: any) => (
                  <div key={it.id} className="border-t border-slate-800 pt-1">
                    <span className="font-medium text-emerald-300">
                      {it.title}:
                    </span>{" "}
                    {it.content}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project Memory Inspector (Rule 28) */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center justify-between">
              <span>Project Memory ({state.projectMemories.length})</span>
            </div>
            <div className="space-y-1.5">
              {state.projectMemories.map((mem: any) => (
                <div
                  key={mem.id}
                  className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px]"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 font-semibold">
                      {mem.category}
                    </span>
                    <span>{mem.createdAt.slice(0, 10)}</span>
                  </div>
                  <div className="font-semibold text-slate-200 mt-1">
                    {mem.title}
                  </div>
                  <div className="text-slate-400 mt-0.5">{mem.content}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER PANE: AI Operating Studio */}
        <main className="flex-1 flex flex-col overflow-y-auto p-5 space-y-5">
          {/* Studio Mode Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            {[
              {
                id: "router",
                label: "1. AI Router & 65% Checkpoint Fallback",
                icon: Layers,
              },
              {
                id: "documents",
                label: "2. Documents, Templates & Quality",
                icon: FileText,
              },
              {
                id: "research",
                label: "3. Deep Research & Image Intelligence",
                icon: Search,
              },
              {
                id: "council",
                label: "4. AI Council (5 Models)",
                icon: Users,
              },
              {
                id: "workflows",
                label: "5. Workflows, Canvas & Voice",
                icon: GitBranch,
              },
              {
                id: "student_resume",
                label: "6. Student, Resume & Slides",
                icon: Briefcase,
              },
              {
                id: "providers",
                label: "7. BYOK, Local AI & Hardware",
                icon: Cpu,
              },
              {
                id: "privacy_storage",
                label: "8. Privacy, Sharing & Storage",
                icon: Shield,
              },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as StudioTab)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    active
                      ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
                      : "text-slate-300 hover:bg-slate-800/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: CENTRAL AI ROUTER, AUTOMATIC PROVIDER FALLBACK & CHECKPOINT ENGINE */}
          {activeTab === "router" && (
            <div className="space-y-5">
              {/* Task Composer */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-400" /> Central AI
                      Router & Automatic Provider Fallback Engine
                    </h2>
                    <p className="text-xs text-slate-400">
                      Capability-based model routing • Smart Cost Guard active •
                      Durable step-by-step checkpoints
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <select
                      value={taskCategory}
                      onChange={(e) => setTaskCategory(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                    >
                      <option value="document">Task: Document Report</option>
                      <option value="research">Task: Deep Research</option>
                      <option value="coding">Task: Coding & Architecture</option>
                      <option value="presentation">Task: Presentation Deck</option>
                      <option value="spreadsheet">Task: Spreadsheet Model</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs text-amber-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateQuotaAt65}
                      onChange={(e) => setSimulateQuotaAt65(e.target.checked)}
                      className="rounded border-slate-700"
                    />
                    <span>
                      Demonstrate Provider A Quota Limit at 65% → Save
                      Checkpoint → Automatic Fallback to Provider B (without
                      restarting Steps 1–3)
                    </span>
                  </label>

                  <button
                    disabled={busyAction === "run_durable_task"}
                    onClick={handleRunDurableTask}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {busyAction === "run_durable_task"
                      ? "Executing & Checkpointing..."
                      : "Execute via Central AI Router"}
                  </button>
                </div>
              </div>

              {/* Smart Cost Guard Notice Banner (Rule 9) */}
              {activeJob?.costGuardNotices?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <strong>Smart Cost Guard:</strong> Paid provider blocked by
                      your settings. Searching for an available free/local
                      alternative.
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px] font-semibold">
                    $0.00 Spent
                  </span>
                </div>
              )}

              {/* Active Task Checkpoint Progress & Replay Engine (Rules 5, 6, 7, 37, 60) */}
              {activeJob && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Durable Task Progress: {activeJob.progressPercent}%
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                        {activeJob.status}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        style={{ width: `${activeJob.progressPercent}%` }}
                        className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500"
                      />
                    </div>

                    <div className="text-xs text-sky-300 bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-xl">
                      <strong>Explainable AI Routing:</strong>{" "}
                      {activeJob.routingExplanation}
                    </div>

                    {/* Step-by-step Checkpoints with Task Replay button */}
                    <div className="space-y-2">
                      {activeJob.steps.map((step: any) => (
                        <div
                          key={step.stepIndex}
                          className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[11px] font-bold">
                              ✓
                            </span>
                            <div>
                              <span className="font-semibold text-slate-200">
                                {step.stepName}
                              </span>{" "}
                              <span className="text-sky-400 font-mono">
                                ({step.progressPercent}%)
                              </span>
                              <div className="text-[10px] text-slate-400">
                                Executed on {step.providerName} ({step.modelName}
                                ) • {step.latencyMs}ms
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleReplayStep(activeJob.jobId, step.stepIndex)
                            }
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 flex items-center gap-1 shrink-0"
                            title={`Replay from Step ${step.stepIndex} without restarting Steps 1–${step.stepIndex - 1}`}
                          >
                            <RotateCcw className="w-3 h-3 text-sky-400" />
                            Replay from here
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Provider Switch History & Compact Continuation Package Inspector */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-amber-400" /> Provider
                      Switch History & Continuation Package
                    </h3>

                    {activeJob.providerSwitchHistory?.length > 0 ? (
                      activeJob.providerSwitchHistory.map(
                        (sw: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 text-xs space-y-1.5"
                          >
                            <div className="font-bold text-amber-300">
                              Automatic Mid-Task Failover Event
                            </div>
                            <div className="font-mono text-[11px] text-slate-200 space-y-1">
                              <div>1. {sw.fromProviderName} ({sw.fromModelName})</div>
                              <div className="text-amber-400">
                                ↓ {sw.failureReason}
                              </div>
                              <div className="text-sky-300">
                                ↓ Checkpoint saved ({sw.checkpointPercent}%) &
                                Continuation Package created
                              </div>
                              <div className="text-emerald-400">
                                ↓ Switched to {sw.toProviderName} ({sw.toModelName})
                              </div>
                              <div className="text-emerald-300 font-semibold">
                                ↓ Resumed from {sw.checkpointPercent}% &
                                Completed (100%)
                              </div>
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                        Completed on primary provider without mid-task switch.
                      </div>
                    )}

                    {/* AI Decision Trace (Rule 59) */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-300">
                        AI Decision Trace:
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1 font-mono">
                        {activeJob.decisionTrace?.map(
                          (trace: string, idx: number) => (
                            <div key={idx}>{trace}</div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Continuation Package Transfer Guarantee (Rule 7) */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                      <div className="font-semibold text-sky-400">
                        Compact Continuation Package (Context Compression):
                      </div>
                      <div className="text-slate-400">
                        {activeJob.continuationPackage?.transferNotice}
                      </div>
                      <div className="text-slate-300">
                        Transferred State:{" "}
                        {activeJob.continuationPackage?.completedSteps?.length ||
                          0}{" "}
                        validated steps,{" "}
                        {
                          activeJob.continuationPackage?.documentStructure
                            ?.length
                        }{" "}
                        document sections, and verified citations.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DOCUMENTS, TEMPLATES, ONE-CLICK PROFESSIONAL MODE, QUALITY CHECKER & REPAIR */}
          {activeTab === "documents" && activeArtifact && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-400" /> Document
                      Intelligence, Template Preservation & Quality Studio
                    </h2>
                    <p className="text-xs text-slate-400">
                      Active Deliverable:{" "}
                      <strong className="text-slate-200">
                        {activeArtifact.title}
                      </strong>{" "}
                      (Version v{activeArtifact.currentVersion})
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleMakeProfessional(activeArtifact.id)}
                      className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Wand2 className="w-3.5 h-3.5" /> Make It Professional
                    </button>
                    <button
                      onClick={() => handleRepairDocument(activeArtifact.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5" /> One-Click Repair
                      Document
                    </button>
                  </div>
                </div>

                {/* Multi-Format Binary Export Bar (Rule 64) */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">
                    Verified Multi-Format Export:
                  </span>
                  {(
                    [
                      "DOCX",
                      "PDF",
                      "PPTX",
                      "XLSX",
                      "CSV",
                      "MD",
                      "TXT",
                      "SVG",
                    ] as const
                  ).map((fmt) => (
                    <a
                      key={fmt}
                      href={`/api/export?format=${fmt}&artifactId=${activeArtifact.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-sky-500/20 border border-slate-800 hover:border-sky-500/40 text-xs font-semibold text-sky-300 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> {fmt}
                    </a>
                  ))}
                </div>
              </div>

              {/* Template Auto-Matching & User Template Preservation (Rules 21, 68) */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold">
                  User Template Preservation & Auto-Matching Pipeline
                </h3>
                <div className="text-[11px] text-slate-400 font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  Upload → Parse → Analyze (Fonts/Colors/Margins/Headers) →
                  Template Schema → Generate → Map Content → Render → Validate →
                  Preview → Export
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {state.templates.map((tpl: any) => (
                    <div
                      key={tpl.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs"
                    >
                      <div className="font-semibold text-sky-300">
                        {tpl.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Format: {tpl.sourceFormat} • Font:{" "}
                        {tpl.typography.headingFont}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Sections: {tpl.requiredSections.length} preserved
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Output Diff & Version History (Rules 30, 65) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-400" /> Version
                    Control History (Never Overwrites Original)
                  </h3>
                  <div className="space-y-2">
                    {activeArtifact.versions.map((ver: any) => (
                      <div
                        key={ver.versionNum}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">
                            Version v{ver.versionNum} — {ver.changeNote}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {ver.providerName} •{" "}
                            {ver.createdAt.slice(0, 19).replace("T", " ")}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            callWorkspaceAction(
                              {
                                action: "restore_artifact_version",
                                artifactId: activeArtifact.id,
                                versionNum: ver.versionNum,
                              },
                              `Restored Version v${ver.versionNum} as latest non-destructive revision.`
                            )
                          }
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-sky-300"
                        >
                          Restore v{ver.versionNum}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold">
                    AI Output Diff Viewer (Accept / Reject / Restore)
                  </h3>
                  {diffResult ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex gap-3 text-[11px]">
                        <span className="text-emerald-400">
                          +{diffResult.additionsCount} additions
                        </span>
                        <span className="text-rose-400">
                          -{diffResult.removalsCount} removals
                        </span>
                        <span className="text-amber-400">
                          ~{diffResult.changedCount} modified sections
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1">
                        {diffResult.chunks
                          .filter((c: any) => c.type !== "UNCHANGED")
                          .slice(0, 12)
                          .map((c: any, idx: number) => (
                            <div
                              key={idx}
                              className={
                                c.type === "ADDED"
                                  ? "text-emerald-300"
                                  : c.type === "REMOVED"
                                  ? "text-rose-300"
                                  : "text-amber-300"
                              }
                            >
                              L{c.lineNumber} [{c.type}]:{" "}
                              {c.newText || c.previousText}
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Click &ldquo;Make It Professional&rdquo; or
                      &ldquo;One-Click Repair Document&rdquo; above to inspect
                      line-by-line additions, removals, and modified sections.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEEP RESEARCH, CONFLICT DETECTION, CITATIONS & WEB IMAGE INTELLIGENCE */}
          {activeTab === "research" && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <Search className="w-4 h-4 text-sky-400" /> Deep Research,
                      Conflict Detection & Licensed Image Intelligence
                    </h2>
                    <p className="text-xs text-slate-400">
                      Multi-source cross-checking • Separate Research vs. Image
                      Sources • APA / MLA / Chicago / IEEE / Harvard
                    </p>
                  </div>
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value="APA">Citation Style: APA</option>
                    <option value="MLA">Citation Style: MLA</option>
                    <option value="Chicago">Citation Style: Chicago</option>
                    <option value="IEEE">Citation Style: IEEE</option>
                    <option value="Harvard">Citation Style: Harvard</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    value={researchQuery}
                    onChange={(e) => setResearchQuery(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100"
                  />
                  <button
                    onClick={handleRunDeepResearch}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
                  >
                    Run Deep Research
                  </button>
                </div>
              </div>

              {researchResult && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Verified Textual Research Sources & Conflict Detection */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-sky-300">
                      Research Sources ({researchResult.sources.length}) &{" "}
                      {researchResult.citationStyle} Bibliography
                    </h3>
                    <div className="space-y-2.5">
                      {researchResult.sources.map((s: any, idx: number) => (
                        <div
                          key={s.id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1"
                        >
                          <div className="font-semibold text-slate-100">
                            [{idx + 1}] {s.title}
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {s.excerpt}
                          </div>
                          <div className="text-[10px] text-sky-400 font-mono">
                            {researchResult.formattedBibliography[idx]}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Conflict Detection Box (Rule 71) */}
                    {researchResult.conflicts?.map((c: any) => (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs space-y-1.5"
                      >
                        <div className="font-bold text-amber-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" /> Conflict
                          detected
                        </div>
                        <div className="text-slate-200">
                          <strong>Source A ({c.sourceA.title}):</strong>{" "}
                          {c.sourceA.claim}
                        </div>
                        <div className="text-slate-200">
                          <strong>Source B ({c.sourceB.title}):</strong>{" "}
                          {c.sourceB.claim}
                        </div>
                        <div className="text-amber-200/90 italic text-[11px]">
                          The system could not confidently resolve the
                          difference. Both verified viewpoints are preserved.
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Separate Image & Diagram Sources with License Verification (Rules 22, 23, 25, 63) */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Licensed Image Sources &
                      Diagram Intelligence ({visualAssets.length})
                    </h3>
                    <div className="space-y-3">
                      {visualAssets.map((vis: any) => (
                        <div
                          key={vis.id}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200">
                              {vis.sourceName} ({vis.visualType})
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                              License: {vis.license}
                            </span>
                          </div>
                          {vis.svgDiagramCode && (
                            <div
                              className="w-full overflow-x-auto rounded-lg border border-slate-800"
                              dangerouslySetInnerHTML={{
                                __html: vis.svgDiagramCode,
                              }}
                            />
                          )}
                          <div className="text-[11px] text-slate-300">
                            <strong>Placement:</strong> {vis.targetSection} •{" "}
                            {vis.placementConfig.caption}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            <strong>Attribution:</strong>{" "}
                            {vis.attributionRequirement} | Retrieved:{" "}
                            {vis.retrievedDate}
                          </div>
                          <button
                            onClick={() => handleReplaceBrokenImage(vis)}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-sky-300"
                          >
                            Simulate Unavailable Image → Auto-Replace &
                            Re-Render
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AI COUNCIL (MULTI-AI COLLABORATION) */}
          {activeTab === "council" && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" /> AI Council —
                  Multi-AI Specialist Collaboration
                </h2>
                <p className="text-xs text-slate-400">
                  Research AI → Reasoning AI → Writing AI → Review AI → Final
                  Synthesizer (Distinct tasks & structured synthesis)
                </p>
                <div className="flex gap-2">
                  <input
                    value={councilTopic}
                    onChange={(e) => setCouncilTopic(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100"
                  />
                  <button
                    onClick={handleRunCouncil}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
                  >
                    Convene AI Council
                  </button>
                </div>
              </div>

              {councilOutput && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {councilOutput.members.map((m: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs"
                      >
                        <div className="font-bold text-sky-400">{m.role}</div>
                        <div className="text-[11px] text-emerald-300 font-medium">
                          {m.modelName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {m.providerName} • {m.latencyMs}ms
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-5 pt-1 border-t border-slate-800">
                          {m.structuredContribution}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-sky-500/30 space-y-2">
                    <div className="text-xs font-bold text-emerald-400">
                      Final Synthesizer Consensus ({councilOutput.consensusScore}
                      % Agreement):
                    </div>
                    <pre className="whitespace-pre-wrap text-xs text-slate-200 font-sans">
                      {councilOutput.finalSynthesis}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: VISUAL WORKFLOW BUILDER, AI CANVAS, AGENTS & VOICE -> WORKFLOW */}
          {activeTab === "workflows" && (
            <div className="space-y-5">
              {/* Voice -> Workflow Compiler (Rule 44) */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Mic className="w-4 h-4 text-sky-400" /> Voice → Workflow
                  Compiler & Visual Pipeline Builder
                </h2>
                <div className="flex gap-2">
                  <input
                    value={voiceTranscript}
                    onChange={(e) => setVoiceTranscript(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
                  />
                  <button
                    onClick={() =>
                      callWorkspaceAction(
                        {
                          action: "voice_to_workflow",
                          transcript: voiceTranscript,
                        },
                        "Voice instruction compiled into executable 6-node Visual Workflow!"
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shrink-0"
                  >
                    Compile Voice → Workflow
                  </button>
                </div>
              </div>

              {/* Visual Workflow Node Graph (Rule 34, 36) */}
              {state.workflows.map((wf: any) => (
                <div
                  key={wf.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">
                        {wf.name}
                      </h3>
                      <p className="text-xs text-slate-400">{wf.description}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                      {wf.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {wf.nodes.map((nd: any) => (
                      <div
                        key={nd.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                            {nd.stepOrder}. {nd.nodeType}
                          </span>
                          <span className="text-emerald-400 text-[10px]">
                            ✓ {nd.status}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-200">
                          {nd.label}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {nd.outputSummary}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* 10 Controlled-Permission AI Agents Directory (Rule 35) */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold">
                  Controlled-Permission AI Agent Templates (10 Specialists)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {state.agents.map((ag: any) => (
                    <div
                      key={ag.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-300">{ag.role}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300">
                          {ag.lastRunStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {ag.description}
                      </p>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Permissions: {ag.controlledPermissions.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: STUDENT MODE, ATS RESUME BUILDER & PRESENTATION MODE */}
          {activeTab === "student_resume" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Student Mode (Rule 46) */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <h2 className="text-sm font-bold flex items-center gap-2 text-sky-300">
                    <BookOpen className="w-4 h-4" /> Student Mode — Flashcards,
                    MCQs & Study Planner
                  </h2>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-300">
                      Interactive Revision Flashcards (Click to flip):
                    </div>
                    {[
                      {
                        q: "What transfers in an AVRENYX Continuation Package during Provider Fallback?",
                        a: "Only validated task state, completed steps, research findings, and document structure — NEVER external provider tokens or credits.",
                      },
                      {
                        q: "How does Prompt Injection Defense protect against malicious PDFs?",
                        a: "Separates <system_instructions> from untrusted <file_content> and <web_content> XML envelopes and strips override payloads.",
                      },
                    ].map((fc, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          setFlippedCard(flippedCard === idx ? null : idx)
                        }
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-sky-500/40 text-xs"
                      >
                        <div className="font-semibold text-sky-300">
                          {flippedCard === idx ? "Answer:" : `Flashcard #${idx + 1}:`}
                        </div>
                        <div className="text-slate-200 mt-1">
                          {flippedCard === idx ? fc.a : fc.q}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* MCQ Practice Quiz */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="font-semibold text-slate-200">
                      Practice MCQ: When User selects &ldquo;Local Only&rdquo;
                      in Privacy Router, which providers are allowed?
                    </div>
                    {[
                      "Only Local AI (Ollama) — Data sent externally: No",
                      "Any cloud provider with free quota",
                      "Paid cloud providers without consent",
                    ].map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedQuizOption(idx)}
                        className={`w-full text-left p-2 rounded-lg border ${
                          selectedQuizOption === idx
                            ? idx === 0
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-200"
                              : "bg-rose-500/20 border-rose-500 text-rose-200"
                            : "border-slate-800 hover:bg-slate-900"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ATS Resume Builder & Presentation Mode Launcher (Rules 45, 47) */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <h2 className="text-sm font-bold flex items-center gap-2 text-emerald-300">
                    <Briefcase className="w-4 h-4" /> ATS Resume Builder &
                    Presentation Mode
                  </h2>
                  <div className="space-y-2 text-xs">
                    <label className="text-slate-400">
                      Job-Specific Role Tailoring:
                    </label>
                    <input
                      value={resumeRoleTarget}
                      onChange={(e) => setResumeRoleTarget(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[11px] text-slate-300">
                      <div className="font-bold text-slate-100">
                        {state.currentUser.name} — {resumeRoleTarget}
                      </div>
                      <div>
                        • Architected capability-based multi-AI router with
                        65% checkpoint continuation and zero-subscription
                        governance.
                      </div>
                      <div>
                        • Implemented AES-256-GCM BYOK secret vault and XML
                        Prompt Injection isolation.
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <a
                        href={`/api/export?format=PDF&title=${encodeURIComponent(
                          `ATS_Resume_${resumeRoleTarget}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 font-bold text-xs flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Export ATS PDF
                      </a>
                      <a
                        href={`/api/export?format=DOCX&title=${encodeURIComponent(
                          `ATS_Resume_${resumeRoleTarget}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-sky-300 font-semibold text-xs flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Export ATS DOCX
                      </a>
                      <button
                        onClick={() => setPresentationFullscreen(true)}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-200 font-semibold text-xs flex items-center gap-1"
                      >
                        <Presentation className="w-3.5 h-3.5" /> Launch
                        Fullscreen Presentation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: BYOK VAULT, LOCAL AI (OLLAMA) & SMART RESOURCE MANAGER */}
          {activeTab === "providers" && (
            <div className="space-y-5">
              {/* BYOK Key Vault (Rule 12) */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Key className="w-4 h-4 text-sky-400" /> Bring Your Own Key
                  (BYOK) Encrypted Vault & Smart Cost Guard
                </h2>
                <p className="text-xs text-slate-400">
                  Keys are encrypted at rest with AES-256-GCM, never exposed in
                  plaintext to the browser, and never logged.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                  <select
                    value={selectedByokProvider}
                    onChange={(e) => setSelectedByokProvider(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
                  >
                    {state.providers
                      .filter((p: any) => p.id !== "ollama")
                      .map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.billingTier})
                        </option>
                      ))}
                  </select>
                  <input
                    type="password"
                    value={byokKeyInput}
                    onChange={(e) => setByokKeyInput(e.target.value)}
                    placeholder="Enter API Key (sk-... / AIza...)"
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-300 px-2">
                    <input
                      type="checkbox"
                      checked={byokAuthorizePaid}
                      onChange={(e) => setByokAuthorizePaid(e.target.checked)}
                    />
                    <span>Authorize Paid Billing for this key</span>
                  </label>
                  <button
                    onClick={() => {
                      if (!byokKeyInput.trim()) return;
                      callWorkspaceAction(
                        {
                          action: "save_byok_key",
                          providerId: selectedByokProvider,
                          apiKey: byokKeyInput,
                          authorizePaidUsage: byokAuthorizePaid,
                        },
                        "API Key encrypted with AES-256-GCM and stored in server vault!"
                      );
                      setByokKeyInput("");
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
                  >
                    Encrypt & Save BYOK Key
                  </button>
                </div>
              </div>

              {/* Local AI (Ollama) & Smart Resource Manager (Rules 13, 83, 84) */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" /> Local AI
                    (Ollama) & Hardware Resource Manager
                  </h3>
                  <span className="text-xs text-slate-400">
                    CPU: {hardware.cpuCores} Cores • Free RAM:{" "}
                    {hardware.freeRamGb} GB / {hardware.totalRamGb} GB
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Local models are never downloaded automatically without
                  explicit user consent.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {state.providers
                    .find((p: any) => p.id === "ollama")
                    ?.models.map((m: any) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="font-bold text-sky-300">{m.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Storage Size: {m.storageSizeGb} GB • Required RAM:{" "}
                          {m.ramRequiredGb} GB • VRAM: {m.vramRequiredGb} GB
                        </div>
                        <div className="text-[10px] text-emerald-400">
                          Status: Local Execution Eligible ($0.00 cost)
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: PRIVACY CENTER, SECURE SHARING & STORAGE DASHBOARD */}
          {activeTab === "privacy_storage" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Privacy Center & Human-in-the-Loop (Rules 72, 73) */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <h2 className="text-sm font-bold flex items-center gap-2 text-sky-300">
                    <Shield className="w-4 h-4" /> Privacy Center & Smart
                    Human-in-the-Loop
                  </h2>
                  <div className="space-y-2.5 text-xs">
                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span>
                        Strict Local-Only Mode (Never send data to external
                        APIs)
                      </span>
                      <input
                        type="checkbox"
                        checked={state.currentUser.localOnlyPrivacy}
                        onChange={(e) =>
                          callWorkspaceAction(
                            {
                              action: "update_user_preferences",
                              localOnlyPrivacy: e.target.checked,
                            },
                            `Local-Only Privacy mode set to ${e.target.checked}`
                          )
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span>
                        Authorize Paid Providers Globally (Smart Cost Guard
                        Opt-In)
                      </span>
                      <input
                        type="checkbox"
                        checked={state.currentUser.allowPaidProviders}
                        onChange={(e) =>
                          callWorkspaceAction(
                            {
                              action: "update_user_preferences",
                              allowPaidProviders: e.target.checked,
                            },
                            `Global Paid Provider authorization set to ${e.target.checked}`
                          )
                        }
                      />
                    </label>
                  </div>

                  {/* Secure Share Links (Rule 48) */}
                  <div className="pt-3 border-t border-slate-800 space-y-2.5">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-purple-400" /> Create
                      Secure Share Link (Password & Expiration)
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={sharePassword}
                        onChange={(e) => setSharePassword(e.target.value)}
                        placeholder="Optional Link Password"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                      />
                      <button
                        onClick={() => {
                          callWorkspaceAction(
                            {
                              action: "create_share_link",
                              artifactId: activeArtifact.id,
                              password: sharePassword,
                              allowDownload: shareAllowDownload,
                            },
                            "Created password-protected, expiring Share Link!"
                          );
                          setSharePassword("");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 font-bold text-xs"
                      >
                        Generate Link
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {state.shareLinks.map((lnk: any) => (
                        <div
                          key={lnk.id}
                          className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-mono text-sky-300">
                              /share/{lnk.token}
                            </span>{" "}
                            • Expires {lnk.expiresAt.slice(0, 10)}
                          </div>
                          <button
                            disabled={lnk.revoked}
                            onClick={() =>
                              callWorkspaceAction(
                                {
                                  action: "revoke_share_link",
                                  linkId: lnk.id,
                                },
                                "Share link revoked!"
                              )
                            }
                            className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]"
                          >
                            {lnk.revoked ? "Revoked" : "Revoke"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Storage Dashboard (Rule 40) */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <h2 className="text-sm font-bold flex items-center gap-2 text-amber-300">
                    <HardDrive className="w-4 h-4" /> Storage Dashboard (User
                    Data vs. Local AI Models Separated)
                  </h2>
                  <div className="space-y-1.5 text-xs font-mono bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex justify-between">
                      <span>Documents</span>
                      <span>{state.storage.documentsGb} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Projects</span>
                      <span>{state.storage.projectsGb} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Images</span>
                      <span>{state.storage.imagesGb} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Artifacts</span>
                      <span>{state.storage.artifactsGb} GB</span>
                    </div>
                    <div className="flex justify-between text-amber-300">
                      <span>Cache</span>
                      <span>{state.storage.cacheGb} GB</span>
                    </div>
                    <div className="flex justify-between text-sky-300 border-t border-slate-800 pt-1">
                      <span>Local AI Models</span>
                      <span>{state.storage.localAiModelsGb} GB</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm border-t border-slate-800 pt-1">
                      <span>Total</span>
                      <span>{state.storage.totalGb} GB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT PANE: Live Preview, Quality Check & Artifact Lineage Tree */}
        <aside
          style={{ width: `${rightWidth}%` }}
          className="w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-slate-800/80 bg-slate-950/70 p-4 overflow-y-auto space-y-5 shrink-0"
        >
          {activeArtifact && (
            <>
              {/* AI Quality Checker Status Box (Rule 32) */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Quality Check (Score:{" "}
                    {activeArtifact.qualityReport.overallScore}/100)
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Verified
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  {activeArtifact.qualityReport.items.map(
                    (item: any, idx: number) => (
                      <div
                        key={idx}
                        className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200"
                      >
                        {item.label}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Artifact Lineage Tree (Rule 29) */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-sky-400">
                  Artifact Lineage (Provenance Tree)
                </div>
                <div className="text-[11px] font-mono bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-100">
                    {activeArtifact.title.slice(0, 38)}... (v
                    {activeArtifact.currentVersion})
                  </div>
                  {activeArtifact.lineage.map((node: any, idx: number) => (
                    <div key={node.id} className="pl-2 text-slate-300">
                      <span className="text-sky-400">
                        {idx === activeArtifact.lineage.length - 1
                          ? "└──"
                          : "├──"}{" "}
                        {node.category}:
                      </span>{" "}
                      <span className="text-slate-400">{node.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Document Preview */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-sky-400" /> Live Deliverable
                    Preview
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {activeArtifact.format} • v{activeArtifact.currentVersion}
                  </span>
                </div>
                <pre className="whitespace-pre-wrap text-xs text-slate-300 font-sans leading-relaxed max-h-96 overflow-y-auto bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  {activeArtifact.content}
                </pre>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
