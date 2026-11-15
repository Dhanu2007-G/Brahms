/**
 * AstraPulse — S8 Wellness Sanctuary (/wellness): Mood River, Animated Breathing Guide, Private Journal & Consent Sharing
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import {
  Compass,
  Heart,
  Lock,
  Radio,
  Share2,
  ShieldCheck,
  Sun,
  Unlock,
  Wind,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMission } from '../context/MissionContext';

type BreathPattern = '4-6' | 'box' | '5-5';

export const WellnessSanctuaryScreen: React.FC = () => {
  const {
    activeCrew,
    activeRole,
    observations,
    journals,
    createJournalEntry,
    toggleJournalShare,
    verifySpecialistJournalAccess,
    sendGroundMessage,
    accessibility,
  } = useMission();

  // Guided Breathing State
  const [breathPattern, setBreathPattern] = useState<BreathPattern>('4-6');
  const [breathRunning, setBreathRunning] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>(
    'Inhale'
  );
  const [breathSecondsLeft, setBreathSecondsLeft] = useState<number>(4);

  // Private Journal Composer State
  const [journalTitle, setJournalTitle] = useState<string>('');
  const [journalBody, setJournalBody] = useState<string>('');
  const [journalMood, setJournalMood] = useState<number>(4);
  const [shareOnCreate, setShareOnCreate] = useState<boolean>(false);
  const [shareExpiresDays, setShareExpiresDays] = useState<number>(7);
  const [rbacTestResult, setRbacTestResult] = useState<string | null>(null);
  const [supportSent, setSupportSent] = useState<boolean>(false);

  useEffect(() => {
    if (!breathRunning) return;
    const id = window.setInterval(() => {
      setBreathSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;
        setBreathPhase((cur) => {
          if (breathPattern === 'box') {
            if (cur === 'Inhale') return 'Hold';
            if (cur === 'Hold') return 'Exhale';
            return 'Inhale';
          }
          return cur === 'Inhale' ? 'Exhale' : 'Inhale';
        });
        if (breathPattern === '4-6') {
          return breathPhase === 'Inhale' ? 6 : 4;
        }
        if (breathPattern === '5-5') {
          return 5;
        }
        return 4;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [breathRunning, breathPattern, breathPhase]);

  const moodRiverData = observations
    .filter((o) => o.metric === 'mood_score')
    .sort((a, b) => a.missionDay - b.missionDay)
    .map((o) => ({
      day: `MD-${o.missionDay}`,
      mood: o.value,
    }));

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalBody.trim()) return;
    await createJournalEntry({
      title: journalTitle || `MD-24 Reflection`,
      body: journalBody,
      moodScore: journalMood,
      tags: shareOnCreate ? ['shared-with-ground'] : ['private'],
      sharedWithGround: shareOnCreate,
      shareExpiresDays,
    });
    setJournalTitle('');
    setJournalBody('');
    setShareOnCreate(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-mono-tabular uppercase tracking-wider text-[#8B7CFF] font-bold">
            WELLNESS SANCTUARY • ISOLATION & CONFINEMENT COUNTERMEASURES
          </span>
          <h1 className="text-xl font-display font-bold text-[#F2F6FF]">
            Autonomic Pacing, Mood River & Private-by-Default Crew Journal
          </h1>
        </div>

        <button
          type="button"
          onClick={async () => {
            await sendGroundMessage({
              subject: `[BHP SUPPORT] Asynchronous Behavioral Health Check-In Request`,
              body: `${activeCrew.name} requesting a routine asynchronous behavioral health & workload pacing check-in with Ground BHP specialist.`,
              priority: 'priority',
              includedMetrics: ['mood_score', 'stress_score', 'sleep_duration_h'],
            });
            setSupportSent(true);
          }}
          className="px-4 py-2 rounded-xl bg-[#8B7CFF] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
        >
          <Radio className="w-4 h-4" />
          <span>
            {supportSent
              ? '✓ Support Packet Queued'
              : 'Request Async Behavioral Support'}
          </span>
        </button>
      </div>

      {/* Row 1: Guided Breathing Ring + Mood River + Circadian Light Planner */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Guided Paced Breathing Ring */}
        <div className="md:col-span-5 glass-panel rounded-2xl p-5 flex flex-col items-center justify-between space-y-4">
          <div className="w-full flex items-center justify-between">
            <h2 className="text-sm font-display font-bold text-[#F2F6FF] flex items-center gap-2">
              <Wind className="w-4 h-4 text-[#3DE0FF]" />
              Guided Autonomic Breathing
            </h2>
            <select
              value={breathPattern}
              onChange={(e) =>
                setBreathPattern(e.target.value as BreathPattern)
              }
              aria-label="Breathing Cadence"
              className="text-xs bg-white/10 rounded px-2 py-1 text-white"
            >
              <option value="4-6" className="bg-[#0A0F1C]">
                4s Inhale / 6s Exhale (Vagal)
              </option>
              <option value="box" className="bg-[#0A0F1C]">
                4-4-4-4 Box Breathing
              </option>
              <option value="5-5" className="bg-[#0A0F1C]">
                5s / 5s Coherent (6 br/min)
              </option>
            </select>
          </div>

          <div className="relative w-44 h-44 flex items-center justify-center">
            <div
              className="w-36 h-36 rounded-full border-4 border-[#3DE0FF] bg-[#3DE0FF]/10 flex flex-col items-center justify-center transition-transform duration-1000"
              style={{
                transform:
                  !accessibility.reduceMotion && breathRunning
                    ? breathPhase === 'Inhale'
                      ? 'scale(1.18)'
                      : 'scale(0.88)'
                    : 'scale(1)',
              }}
            >
              <span className="text-sm font-display font-bold text-[#3DE0FF]">
                {breathRunning ? breathPhase : 'Ready'}
              </span>
              <span className="text-2xl font-mono-tabular font-bold text-[#F2F6FF]">
                {breathRunning ? `${breathSecondsLeft}s` : breathPattern}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setBreathRunning((r) => !r)}
            className="w-full py-2.5 rounded-xl bg-[#3DE0FF] text-[#04060C] text-xs font-display font-bold cursor-pointer"
          >
            {breathRunning ? 'Pause Breathing Guide' : 'Start 4-Minute Session'}
          </button>
        </div>

        {/* Mood River & Circadian Light Schedule */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <div className="glass-panel rounded-2xl p-4 space-y-2 flex-1">
            <h2 className="text-sm font-display font-bold text-[#F2F6FF]">
              24-Day Mood River (1 = Depleted, 5 = Energized)
            </h2>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={moodRiverData}>
                  <XAxis
                    dataKey="day"
                    stroke="#7C89A6"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[1, 5]}
                    stroke="#7C89A6"
                    fontSize={10}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A0F1C',
                      borderColor: 'rgba(255,255,255,0.15)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="#8B7CFF"
                    fill="rgba(139, 124, 255, 0.22)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2DD4BF] flex items-center gap-1.5">
                <Sun className="w-4 h-4" /> Circadian Solid-State Lighting
                Protocol
              </h3>
              <span className="text-[11px] font-mono-tabular text-[#A9B4CC]">
                NASA-STD-3001
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#04060C]/60 border border-cyan-400/30">
                <div className="font-bold text-[#3DE0FF]">06:00–08:30 UTC</div>
                <div className="text-[11px] text-[#A9B4CC]">
                  Blue-enriched 480nm wake boost (250 melanopic EDI lux)
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#04060C]/60 border border-white/10">
                <div className="font-bold text-[#F2F6FF]">08:30–19:30 UTC</div>
                <div className="text-[11px] text-[#A9B4CC]">
                  Balanced white operational habitat spectrum
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#04060C]/60 border border-amber-400/30">
                <div className="font-bold text-[#FFB547]">20:00–22:00 UTC</div>
                <div className="text-[11px] text-[#A9B4CC]">
                  Warm blue-depleted pre-sleep wind-down (&lt;15 lux)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Private-by-Default Crew Journal & Consent Grant Controls (Directive 9) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* New Journal Entry Composer */}
        <form
          onSubmit={handleSaveJournal}
          className="md:col-span-5 glass-panel rounded-2xl p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#2DD4BF]" />
              New Crew Reflection
            </h2>
            <span className="px-2 py-0.5 rounded bg-teal-500/15 border border-teal-400/40 text-[10px] font-mono-tabular text-[#2DD4BF]">
              PRIVATE BY DEFAULT
            </span>
          </div>

          <p className="text-xs text-[#A9B4CC]">
            Unshared entries are strictly blocked from Ground Specialist APIs
            and the Ground Console (`403 Forbidden`).
          </p>

          <div>
            <label className="block text-xs text-[#A9B4CC] mb-1">Title</label>
            <input
              type="text"
              value={journalTitle}
              onChange={(e) => setJournalTitle(e.target.value)}
              placeholder="e.g., Post-EVA recovery & sleep notes"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-[#A9B4CC] mb-1">
              Reflection Body
            </label>
            <textarea
              rows={4}
              required
              value={journalBody}
              onChange={(e) => setJournalBody(e.target.value)}
              placeholder="Write privately on-device…"
              className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#04060C]/70 border border-white/10 space-y-2">
            <label className="flex items-center justify-between text-xs text-[#F2F6FF] cursor-pointer">
              <span className="flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-[#3DE0FF]" />
                Explicitly share this entry with Ground Flight Surgeon
              </span>
              <input
                type="checkbox"
                checked={shareOnCreate}
                onChange={(e) => setShareOnCreate(e.target.checked)}
              />
            </label>
            {shareOnCreate && (
              <div className="flex items-center justify-between text-[11px] text-[#A9B4CC] pt-1">
                <span>Auto-expire consent grant after:</span>
                <select
                  value={shareExpiresDays}
                  onChange={(e) => setShareExpiresDays(Number(e.target.value))}
                  className="bg-white/10 rounded px-2 py-0.5 text-white"
                >
                  <option value={3} className="bg-[#0A0F1C]">
                    3 Days
                  </option>
                  <option value={7} className="bg-[#0A0F1C]">
                    7 Days
                  </option>
                  <option value={14} className="bg-[#0A0F1C]">
                    14 Days
                  </option>
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#2DD4BF] text-[#04060C] text-xs font-display font-bold cursor-pointer"
          >
            Save {shareOnCreate ? 'Shared' : 'Private'} Journal Entry
          </button>
        </form>

        {/* Journal Entries List & Per-Entry Consent Revocation */}
        <div className="md:col-span-7 glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-[#F2F6FF]">
              Crew Journal Archive ({journals.length} visible as {activeRole})
            </h2>
            <span className="text-xs font-mono-tabular text-[#7C89A6]">
              Role: {activeRole.toUpperCase()}
            </span>
          </div>

          {rbacTestResult && (
            <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-400/40 text-xs text-indigo-200 font-mono-tabular">
              {rbacTestResult}
            </div>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {journals.map((j) => (
              <div
                key={j.id}
                className="p-4 rounded-xl bg-[#04060C]/75 border border-white/15 space-y-2"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {j.sharedWithGround ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/40 text-[10px] font-mono-tabular text-[#3DE0FF]">
                        <Unlock className="w-3 h-3" /> SHARED WITH GROUND
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-500/15 border border-teal-400/40 text-[10px] font-mono-tabular text-[#2DD4BF]">
                        <Lock className="w-3 h-3" /> PRIVATE — ON-DEVICE ONLY
                      </span>
                    )}
                    <span className="text-xs font-mono-tabular text-[#7C89A6]">
                      MD-{j.missionDay} • {j.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await verifySpecialistJournalAccess(j.id);
                        setRbacTestResult(
                          `GET /api/v1/journal/${j.id} (X-Astra-Role: specialist) → HTTP ${res.status}: ${res.message}`
                        );
                      }}
                      className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[11px] font-mono-tabular text-[#A9B4CC] hover:text-white cursor-pointer"
                    >
                      Verify Specialist API Gate
                    </button>

                    {activeRole === 'astronaut' && (
                      <button
                        type="button"
                        onClick={() =>
                          toggleJournalShare(j.id, !j.sharedWithGround, 7)
                        }
                        className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                          j.sharedWithGround
                            ? 'bg-rose-500/20 border border-rose-400/40 text-[#FF5C93]'
                            : 'bg-[#3DE0FF]/20 border border-[#3DE0FF]/40 text-[#3DE0FF]'
                        }`}
                      >
                        {j.sharedWithGround
                          ? 'Revoke Share Immediately'
                          : 'Share with Ground (7d)'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-sm font-display font-bold text-[#F2F6FF]">
                  {j.title}
                </div>
                <p className="text-xs text-[#A9B4CC] leading-relaxed">
                  {j.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
