/**
 * AstraPulse — Application Chrome: TopRail, OrbitRail, SimulatedBanner, OfflineBanner, TimeConductor, CommandPalette
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import {
  Activity,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  Compass,
  Download,
  FileText,
  HeartPulse,
  HelpCircle,
  Home,
  Keyboard,
  Layers,
  LineChart,
  Radio,
  RefreshCw,
  Rocket,
  Search,
  Settings,
  Shield,
  Sparkles,
  UserCheck,
  WifiOff,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { computeLightTimeDelaySec, computeXpAndLevel } from '../analytics/engine';
import {
  ENVIRONMENT_MODES,
  MANDATORY_SIMULATED_DISCLOSURE,
} from '../analytics/ruleset';
import { EnvironmentMode } from '../analytics/types';
import { ScreenRoute, useMission } from '../context/MissionContext';
import { StatusChip } from './StatusChip';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const ShellChrome: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    route,
    navigate,
    crewList,
    activeCrew,
    selectCrew,
    activeRole,
    setActiveRole,
    environmentMode,
    setEnvironmentMode,
    selectedMissionDay,
    setSelectedMissionDay,
    compareBaselineMode,
    setCompareBaselineMode,
    overallTier,
    alerts,
    hasSimulatedDataInView,
    offlineSimMode,
    setOfflineSimMode,
    solarBlackoutMode,
    setSolarBlackoutMode,
    syncQueue,
    flushOfflineQueue,
    commandPaletteOpen,
    setCommandPaletteOpen,
    shortcutsModalOpen,
    setShortcutsModalOpen,
    accessibility,
    triggerBodyScan,
    setBodyTwinSide,
  } = useMission();

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const envProfile = ENVIRONMENT_MODES[environmentMode];
  const oneWayDelaySec = computeLightTimeDelaySec(envProfile.typicalDistanceKm);
  const openAlertsCount = alerts.filter((a) => a.status === 'open').length;
  const xpInfo = computeXpAndLevel(activeCrew.xp);

  const navItems: {
    to: ScreenRoute;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      to: '/',
      label: 'Crew Core (Home)',
      shortLabel: 'Core',
      icon: <Home className="w-4 h-4" />,
    },
    {
      to: '/ritual',
      label: 'Pulse Ritual (Check-In)',
      shortLabel: 'Ritual',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      to: '/measure',
      label: 'Measure Lab',
      shortLabel: 'Measure',
      icon: <HeartPulse className="w-4 h-4" />,
    },
    {
      to: '/insights',
      label: 'Insights & Trends',
      shortLabel: 'Insights',
      icon: <LineChart className="w-4 h-4" />,
    },
    {
      to: '/alerts',
      label: 'Alert Center & Care',
      shortLabel: 'Alerts',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: openAlertsCount > 0 ? openAlertsCount : undefined,
    },
    {
      to: '/wellness',
      label: 'Wellness Sanctuary',
      shortLabel: 'Wellness',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      to: '/link',
      label: 'Ground Link (Comms)',
      shortLabel: 'Link',
      icon: <Radio className="w-4 h-4" />,
    },
    {
      to: '/habitat',
      label: 'Habitat & Radiation',
      shortLabel: 'Habitat',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      to: '/3d',
      label: '3D Orbital Twin (WebGL)',
      shortLabel: '3D Twin',
      icon: <Rocket className="w-4 h-4" />,
    },
    {
      to: '/copilot',
      label: 'AI Copilot & Live Studio',
      shortLabel: 'AI Studio',
      icon: <Sparkles className="w-4 h-4" />,
    },
    ...(accessibility.hideGamification
      ? []
      : [
          {
            to: '/quests' as ScreenRoute,
            label: 'Quests & Star Map',
            shortLabel: 'Quests',
            icon: <Award className="w-4 h-4" />,
          },
        ]),
    {
      to: '/reports',
      label: 'Reports & NASA Evidence',
      shortLabel: 'Reports',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      to: '/ground',
      label: 'Ground Console (Specialist)',
      shortLabel: 'Ground',
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      to: '/settings',
      label: 'Settings & Access',
      shortLabel: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const showTimeConductor = route === '/' || route === '/insights';

  return (
    <div className="min-h-screen flex flex-col bg-[#04060C] text-[#F2F6FF]">
      {/* Mandatory Sticky SIMULATED / Decision-Support Disclosure Bar (Directive 7) */}
      {hasSimulatedDataInView && (
        <div
          role="region"
          aria-label="Simulated Data and Medical Disclaimer"
          className="sticky top-0 z-40 w-full bg-[#0A0F1C]/95 border-b border-amber-400/35 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-[#FFB547] font-mono-tabular font-bold text-[10px] uppercase tracking-wider">
              SIMULATED
            </span>
            <span className="text-[#F2F6FF] font-medium">
              {MANDATORY_SIMULATED_DISCLOSURE}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#A9B4CC]">
            <span>Team Zenitsu • Ruleset v1.0.0-demo</span>
            <button
              type="button"
              onClick={() => navigate('/enter')}
              className="text-[#3DE0FF] hover:underline cursor-pointer font-medium"
            >
              Switch Scenario / Mission Entry →
            </button>
          </div>
        </div>
      )}

      {/* Offline / Solar Blackout Status Banner */}
      {(offlineSimMode || solarBlackoutMode || syncQueue.length > 0) && (
        <div className="w-full bg-indigo-950/80 border-b border-indigo-400/35 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-indigo-200">
            <WifiOff className="w-4 h-4 text-[#8B7CFF]" />
            <span>
              {solarBlackoutMode
                ? 'Solar Conjunction Blackout Active — Store-and-forward autonomy mode enabled.'
                : 'Offline Mode Active — All check-ins and measurements are saved locally to IndexedDB.'}
            </span>
            <span className="font-mono-tabular px-2 py-0.5 rounded bg-white/10 text-white">
              Queue: {syncQueue.length} pending
            </span>
          </div>
          <div className="flex items-center gap-2">
            {syncQueue.length > 0 && (
              <button
                type="button"
                onClick={flushOfflineQueue}
                className="px-2.5 py-1 rounded bg-[#2DD4BF] text-[#04060C] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Sync Queue Now
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setOfflineSimMode(false);
                setSolarBlackoutMode(false);
              }}
              className="text-xs text-[#3DE0FF] hover:underline cursor-pointer"
            >
              Restore Live Link
            </button>
          </div>
        </div>
      )}

      {/* Top Mission Telemetry Rail */}
      <header className="w-full bg-[#0A0F1C]/85 border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Mission Day */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#3DE0FF]/15 border border-[#3DE0FF]/40 flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#3DE0FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base tracking-tight text-[#F2F6FF]">
                  AstraPulse
                </span>
                <span className="text-[10px] font-mono-tabular px-1.5 py-0.5 rounded bg-white/10 text-[#3DE0FF]">
                  ZENITSU
                </span>
              </div>
              <div className="text-[11px] text-[#A9B4CC] font-mono-tabular">
                ARES-01 • MD-{selectedMissionDay}/180
              </div>
            </div>
          </button>

          {/* Crew Scenario Switcher */}
          <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-white/10">
            <label
              htmlFor="crew-switcher"
              className="text-[11px] text-[#7C89A6] font-medium"
            >
              Crew:
            </label>
            <select
              id="crew-switcher"
              value={activeCrew.id}
              onChange={(e) => selectCrew(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-xs font-medium text-[#F2F6FF] cursor-pointer"
            >
              {crewList.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0A0F1C]">
                  {c.id} — {c.name} ({c.scenarioTitle})
                </option>
              ))}
            </select>
          </div>

          {/* Environment Mode Switcher */}
          <div className="hidden xl:flex items-center gap-1.5">
            <label
              htmlFor="env-switcher"
              className="text-[11px] text-[#7C89A6] font-medium"
            >
              Env:
            </label>
            <select
              id="env-switcher"
              value={environmentMode}
              onChange={(e) =>
                setEnvironmentMode(e.target.value as EnvironmentMode)
              }
              className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-xs font-medium text-[#F2F6FF] cursor-pointer"
            >
              {Object.values(ENVIRONMENT_MODES).map((env) => (
                <option key={env.id} value={env.id} className="bg-[#0A0F1C]">
                  {env.shortName} ({env.gravityLabel})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Comms Delay, Role Toggle, Status Chip, Command Palette & PWA */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono-tabular text-[#A9B4CC]"
            title="One-way light-time communication delay to Earth"
          >
            <Radio className="w-3.5 h-3.5 text-[#A3E635]" />
            <span>
              OWLT: {oneWayDelaySec >= 60 ? `${(oneWayDelaySec / 60).toFixed(1)}m` : `${oneWayDelaySec}s`}
            </span>
          </div>

          <StatusChip tier={overallTier} compact />

          {/* Role Switcher (Astronaut vs Ground Specialist) */}
          <div className="inline-flex rounded-lg bg-white/5 p-0.5 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveRole('astronaut')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                activeRole === 'astronaut'
                  ? 'bg-[#3DE0FF] text-[#04060C] font-bold'
                  : 'text-[#A9B4CC] hover:text-white'
              }`}
            >
              Astronaut
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRole('specialist');
                navigate('/ground');
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                activeRole === 'specialist'
                  ? 'bg-[#8B7CFF] text-white font-bold'
                  : 'text-[#A9B4CC] hover:text-white'
              }`}
            >
              Specialist
            </button>
          </div>

          {/* Command Palette Trigger */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="touch-target px-2.5 py-1.5 rounded-lg glass-panel hover:bg-white/10 text-xs text-[#A9B4CC] flex items-center gap-1.5 cursor-pointer"
            title="Command Palette (Ctrl/Cmd + K)"
          >
            <Search className="w-3.5 h-3.5 text-[#3DE0FF]" />
            <span className="hidden md:inline">Command</span>
            <kbd className="hidden md:inline px-1 py-0.5 text-[10px] font-mono-tabular bg-white/10 rounded">
              ⌘K
            </kbd>
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            type="button"
            onClick={() => setShortcutsModalOpen(true)}
            className="p-1.5 rounded-lg glass-panel hover:bg-white/10 text-[#A9B4CC] cursor-pointer"
            title="Keyboard Shortcuts (?)"
            aria-label="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* PWA Install Button when available */}
          {deferredPrompt && (
            <button
              type="button"
              onClick={async () => {
                await deferredPrompt.prompt();
                setDeferredPrompt(null);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#2DD4BF]/20 border border-[#2DD4BF]/50 text-[#2DD4BF] text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Install App
            </button>
          )}
        </div>
      </header>

      {/* Main Layout: Left Orbit Rail + Active Screen */}
      <div className="flex-1 flex min-h-0">
        {/* Desktop Left Orbit Rail */}
        <aside
          aria-label="Mission Navigation Rail"
          className="hidden md:flex flex-col justify-between w-52 shrink-0 bg-[#0A0F1C]/65 border-r border-white/10 p-2.5"
        >
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = route === item.to;
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => navigate(item.to)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                    active
                      ? 'bg-[#3DE0FF]/15 text-[#3DE0FF] border border-[#3DE0FF]/40 font-semibold'
                      : 'text-[#A9B4CC] hover:bg-white/5 hover:text-[#F2F6FF] border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-400/40 text-[#FF5C93] font-mono-tabular text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Crew Streak & Offline Sim Quick Card */}
          <div className="space-y-2 pt-3 border-t border-white/10">
            {!accessibility.hideGamification && (
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <div className="flex items-center justify-between text-[#A9B4CC]">
                  <span>Level {xpInfo.level}</span>
                  <span className="font-mono-tabular text-[#2DD4BF]">
                    {activeCrew.streakDays}d streak
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#3DE0FF]"
                    style={{ width: `${xpInfo.progressPct}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setOfflineSimMode(!offlineSimMode)}
              className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-medium flex items-center justify-between cursor-pointer ${
                offlineSimMode
                  ? 'border-amber-400/50 bg-amber-500/15 text-[#FFB547]'
                  : 'border-white/10 bg-white/5 text-[#A9B4CC] hover:text-white'
              }`}
            >
              <span>Offline Sim</span>
              <span className="font-mono-tabular">
                {offlineSimMode ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </aside>

        {/* Main Screen Viewport */}
        <main className="flex-1 min-w-0 overflow-y-auto flex flex-col">
          <div className="flex-1 p-3 sm:p-5">{children}</div>

          {/* Bottom Time Conductor Scrubber (Crew Core & Insights) */}
          {showTimeConductor && (
            <div className="sticky bottom-0 z-30 bg-[#0A0F1C]/95 border-t border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#3DE0FF]" />
                <span className="text-xs font-semibold text-[#F2F6FF]">
                  Time Conductor:
                </span>
                <span className="font-mono-tabular text-xs px-2 py-0.5 rounded bg-[#3DE0FF]/15 text-[#3DE0FF] font-bold">
                  Mission Day {selectedMissionDay}
                </span>
                {selectedMissionDay < 24 && (
                  <button
                    type="button"
                    onClick={() => setSelectedMissionDay(24)}
                    className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[#FFB547] text-[11px] font-semibold cursor-pointer"
                  >
                    Return to Now (MD-24) [N]
                  </button>
                )}
              </div>

              <div className="flex-1 max-w-xl flex items-center gap-3">
                <span className="text-[11px] font-mono-tabular text-[#7C89A6]">
                  MD-1
                </span>
                <input
                  type="range"
                  min={1}
                  max={24}
                  value={selectedMissionDay}
                  onChange={(e) =>
                    setSelectedMissionDay(Number(e.target.value))
                  }
                  aria-label="Mission Day Timeline Scrubber"
                  className="w-full accent-[#3DE0FF] cursor-pointer"
                />
                <span className="text-[11px] font-mono-tabular text-[#7C89A6]">
                  MD-24
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCompareBaselineMode((p) => !p)}
                  className={`px-3 py-1 rounded-lg border text-xs font-medium cursor-pointer transition ${
                    compareBaselineMode
                      ? 'bg-[#2DD4BF]/20 border-[#2DD4BF] text-[#2DD4BF]'
                      : 'bg-white/5 border-white/10 text-[#A9B4CC] hover:text-white'
                  }`}
                >
                  Compare vs 14d Baseline [C]
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden sticky bottom-0 z-40 bg-[#0A0F1C]/95 border-t border-white/10 grid grid-cols-6 gap-1 px-2 py-1.5"
      >
        {navItems.slice(0, 6).map((item) => {
          const active = route === item.to;
          return (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] ${
                active ? 'text-[#3DE0FF] font-bold' : 'text-[#A9B4CC]'
              }`}
            >
              {item.icon}
              <span className="mt-0.5 truncate">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Command Palette Modal (Ctrl/Cmd + K) */}
      {commandPaletteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Command Palette"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#0A0F1C] border border-white/20 shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-white/10 flex items-center gap-2">
              <Search className="w-4 h-4 text-[#3DE0FF]" />
              <input
                type="text"
                autoFocus
                placeholder="Jump to screen, switch crew scenario, or run command…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(false)}
                className="text-xs text-[#A9B4CC] hover:text-white"
              >
                ESC
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {navItems
                .filter((n) =>
                  n.label.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((n) => (
                  <button
                    key={n.to}
                    type="button"
                    onClick={() => {
                      navigate(n.to);
                      setCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-xs text-left text-[#F2F6FF] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      {n.icon}
                      {n.label}
                    </span>
                    <span className="text-[10px] font-mono-tabular text-[#7C89A6]">
                      Jump
                    </span>
                  </button>
                ))}
              <div className="pt-2 pb-1 px-3 text-[10px] uppercase tracking-wider text-[#7C89A6]">
                Switch Crew Scenario
              </div>
              {crewList.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    selectCrew(c.id);
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-xs text-left text-[#F2F6FF] cursor-pointer"
                >
                  <span>
                    {c.id} — {c.name} ({c.scenarioTitle})
                  </span>
                  <span className="text-[10px] font-mono-tabular text-[#3DE0FF]">
                    Select
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Reference Modal (?) */}
      {shortcutsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard Shortcuts"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#0A0F1C] border border-white/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-[#F2F6FF]">
                Mission Keyboard Shortcuts
              </h3>
              <button
                type="button"
                onClick={() => setShortcutsModalOpen(false)}
                className="p-1 text-[#A9B4CC] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { key: 'F', desc: 'Flip Body Twin (Front/Back)' },
                { key: 'S', desc: 'Run 2s Body System Scan' },
                { key: 'R', desc: 'Open Pulse Ritual Check-In' },
                { key: 'N', desc: 'Return Time Conductor to Now' },
                { key: 'C', desc: 'Toggle Baseline Comparison' },
                { key: 'L', desc: 'Open Ground Link Comms' },
                { key: '⌘K / Ctrl+K', desc: 'Open Command Palette' },
                { key: 'Esc', desc: 'Close Drawers & Modals' },
              ].map((s) => (
                <div
                  key={s.key}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
                >
                  <span className="text-[#A9B4CC]">{s.desc}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono-tabular text-[#3DE0FF]">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
