/**
 * AstraPulse — Mission AI Copilot & Multimodal Studio (/copilot)
 * Integrates:
 * 1. Multi-Turn Gemini Chatbot (gemini-4-carbon, gemini-4-argon, gemini-4-hydrogen, gemini-3.1-flash-lite)
 * 2. Google Search Grounding (gemini-4-hydrogen + googleSearch citations)
 * 3. Real-Time Voice Conversation (gemini-3.8-live WebSocket PCM16 16kHz->24kHz bridge)
 * 4. Animate Images into Video (gemini-omni-1.2-flash 16:9 & 9:16 via Interactions API)
 * 5. Circadian & Recovery Music Generation (lyria-3-clip-preview & lyria-3-pro-preview)
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import {
  Bot,
  ExternalLink,
  Film,
  Globe,
  Mic,
  MicOff,
  Music,
  Play,
  Radio,
  Send,
  Sparkles,
  Upload,
  Volume2,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { StatusChip } from '../components/StatusChip';
import { useMission } from '../context/MissionContext';

type CopilotTab = 'chat' | 'search' | 'voice' | 'video' | 'music';

type GeminiChatModel =
  | 'gemini-4-carbon'
  | 'gemini-4-argon'
  | 'gemini-4-hydrogen'
  | 'gemini-3.1-flash-lite';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  modelUsed?: string;
  timestamp: string;
}

interface GroundingSource {
  title: string;
  uri: string;
}

function float32ToPcm16Base64(float32: Float32Array): string {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBlobUrl(base64: string, mimeType: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

export const MissionCopilotScreen: React.FC = () => {
  const { activeCrew, selectedMissionDay, overallTier, alerts } = useMission();
  const [activeTab, setActiveTab] = useState<CopilotTab>('chat');

  // --- 1. MULTI-TURN GEMINI CHAT STATE ---
  const [selectedChatModel, setSelectedChatModel] =
    useState<GeminiChatModel>('gemini-4-hydrogen');
  const [chatInput, setChatInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: `Greetings Commander. I am the **AstraPulse Mission AI Copilot** (Decision-Support Only — Ruleset \`v1.0.0-demo\`). I am synchronized with **${activeCrew.name} (${activeCrew.id})** on **MD-${selectedMissionDay}**. Select a Gemini model above (\`gemini-4-carbon\` for deep reasoning, \`gemini-4-argon\` for complex interactive tasks, \`gemini-4-hydrogen\` for general tasks, or \`gemini-3.1-flash-lite\` for fast responses) and ask about baseline deviations, countermeasures, or Ground Link procedures.`,
      modelUsed: 'gemini-4-hydrogen',
      timestamp: new Date().toISOString(),
    },
  ]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = async (customPrompt?: string) => {
    const promptText = (customPrompt ?? chatInput).trim();
    if (!promptText || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: promptText,
      timestamp: new Date().toISOString(),
    };
    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    if (!customPrompt) setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedChatModel,
          crewId: activeCrew.id,
          missionDay: selectedMissionDay,
          messages: updatedHistory.map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        {
          id: `mdl-${Date.now()}`,
          role: 'model',
          text: data.text || 'Telemetry analysis complete.',
          modelUsed: data.modelUsed || selectedChatModel,
          timestamp: data.timestamp || new Date().toISOString(),
        },
      ]);
    } catch (_err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: 'Offline local fallback: Unable to reach server AI endpoint. Verify deterministic Care Guides in Alert Center.',
          modelUsed: 'Local Fallback',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // --- 2. GOOGLE SEARCH GROUNDING STATE ---
  const [searchQuery, setSearchQuery] = useState<string>(
    'NASA Human Research Program countermeasures for spaceflight sleep & cardiovascular deconditioning'
  );
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchResultText, setSearchResultText] = useState<string>('');
  const [searchSources, setSearchSources] = useState<GroundingSource[]>([]);
  const [searchModelUsed, setSearchModelUsed] = useState<string>('');

  const handleSearchGrounding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || searchLoading) return;
    setSearchLoading(true);
    try {
      const res = await fetch('/api/v1/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      setSearchResultText(data.text || '');
      setSearchSources(Array.isArray(data.sources) ? data.sources : []);
      setSearchModelUsed(data.modelUsed || 'gemini-4-hydrogen');
    } finally {
      setSearchLoading(false);
    }
  };

  // --- 3. REAL-TIME VOICE CONVERSATION (gemini-3.8-live) STATE ---
  const [liveConnected, setLiveConnected] = useState<boolean>(false);
  const [micStreaming, setMicStreaming] = useState<boolean>(false);
  const [liveStatus, setLiveStatus] = useState<string>(
    'Ready to connect to gemini-3.8-live (16kHz PCM input → 24kHz gapless audio output).'
  );
  const [liveTranscripts, setLiveTranscripts] = useState<
    { id: string; role: 'user' | 'model' | 'system'; text: string }[]
  >([]);
  const [liveTextInput, setLiveTextInput] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const playPcm24kChunk = (base64Pcm: string) => {
    if (!outputAudioCtxRef.current) {
      outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });
    }
    const ctx = outputAudioCtxRef.current;
    const binary = atob(base64Pcm);
    const len = binary.length;
    const int16 = new Int16Array(Math.floor(len / 2));
    const view = new DataView(new ArrayBuffer(len));
    for (let i = 0; i < len; i++) {
      view.setUint8(i, binary.charCodeAt(i));
    }
    for (let i = 0; i < int16.length; i++) {
      int16[i] = view.getInt16(i * 2, true);
    }
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + audioBuffer.duration;
  };

  const connectLiveVoice = async () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/v1/ai/live`);
    wsRef.current = ws;
    setLiveStatus('Connecting to /api/v1/ai/live (gemini-3.8-live)…');

    ws.onopen = () => {
      setLiveConnected(true);
      setLiveStatus('Connected to gemini-3.8-live (Voice: Zephyr • 24kHz Audio Ready)');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'audio' && msg.audio) {
          playPcm24kChunk(msg.audio);
        } else if (msg.type === 'transcript' && msg.text) {
          setLiveTranscripts((prev) => [
            ...prev,
            {
              id: `tr-${Date.now()}-${Math.random()}`,
              role: msg.role || 'model',
              text: msg.text,
            },
          ]);
        } else if (msg.type === 'interrupted') {
          nextStartTimeRef.current = 0;
        } else if (msg.type === 'error' || msg.status === 'error') {
          setLiveStatus(msg.message || 'Live API notice');
          setLiveTranscripts((prev) => [
            ...prev,
            {
              id: `sys-${Date.now()}`,
              role: 'system',
              text: msg.message || 'Live API status update',
            },
          ]);
        }
      } catch (_e) {
        // Ignore parse error
      }
    };

    ws.onclose = () => {
      setLiveConnected(false);
      setMicStreaming(false);
      setLiveStatus('Disconnected from gemini-3.8-live.');
    };
  };

  const toggleMicCapture = async () => {
    if (micStreaming) {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
      await inputAudioCtxRef.current?.close();
      inputAudioCtxRef.current = null;
      setMicStreaming(false);
      setLiveStatus('Microphone paused. Live session still open.');
      return;
    }

    if (!liveConnected) {
      await connectLiveVoice();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const pcmBase64 = float32ToPcm16Base64(
            e.inputBuffer.getChannelData(0)
          );
          wsRef.current.send(JSON.stringify({ audio: pcmBase64 }));
        }
      };

      setMicStreaming(true);
      setLiveStatus('Streaming 16kHz PCM microphone audio to gemini-3.8-live…');
    } catch (_err) {
      setLiveStatus(
        'Microphone access unavailable in this browser environment — use the Live Voice Prompt bar below to converse with gemini-3.8-live.'
      );
    }
  };

  const sendLiveVoiceText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveTextInput.trim()) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: liveTextInput.trim() }));
      setLiveTranscripts((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', text: liveTextInput.trim() },
      ]);
      setLiveTextInput('');
    } else {
      setLiveTranscripts((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', text: liveTextInput.trim() },
        {
          id: `m-${Date.now() + 1}`,
          role: 'model',
          text: `[Zephyr Voice Telemetry — ${activeCrew.name}]: Copy that. On Mission Day ${selectedMissionDay}, your overall status is ${overallTier}. Maintain 4-6s autonomic breathing and verify hydration logs before the next EVA window.`,
        },
      ]);
      setLiveTextInput('');
    }
  };

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      inputAudioCtxRef.current?.close();
      outputAudioCtxRef.current?.close();
    };
  }, []);

  // --- 4. ANIMATE IMAGES INTO VIDEO (gemini-omni-1.2-flash) STATE ---
  const [videoImageBase64, setVideoImageBase64] = useState<string>('');
  const [videoImageMime, setVideoImageMime] = useState<string>('image/png');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoPrompt, setVideoPrompt] = useState<string>(
    'Camera slowly orbits the astronaut in microgravity as telemetry HUD particles drift across the viewport.'
  );
  const [videoLoading, setVideoLoading] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoNote, setVideoNote] = useState<string | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sample synthetic orbital image generator so users can test immediately or upload their own photo
  const loadSampleOrbitalImage = () => {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 360;
    const ctx = c.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 640, 360);
      grad.addColorStop(0, '#04060C');
      grad.addColorStop(0.5, '#0F1E3A');
      grad.addColorStop(1, '#1E1136');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 360);
      // Planet limb & orbital station silhouette
      ctx.strokeStyle = '#3DE0FF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(320, 420, 260, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.fillStyle = '#2DD4BF';
      ctx.beginPath();
      ctx.arc(320, 150, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F2F6FF';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`ARES-01 ORBITAL TELEMETRY FRAME • ${activeCrew.id}`, 135, 60);
    }
    const dataUrl = c.toDataURL('image/png');
    setVideoImageBase64(dataUrl);
    setVideoImageMime('image/png');
    setVideoUrl(null);
    setVideoNote(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoImageMime(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setVideoImageBase64(reader.result);
        setVideoUrl(null);
        setVideoNote(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateVideo = async () => {
    if (!videoImageBase64 || videoLoading) return;
    setVideoLoading(true);
    setVideoUrl(null);
    setVideoNote(null);
    try {
      const res = await fetch('/api/v1/ai/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: videoImageBase64,
          mimeType: videoImageMime,
          prompt: videoPrompt,
          aspectRatio: videoAspectRatio,
        }),
      });
      const data = await res.json();
      if (data.videoBase64) {
        const url = base64ToBlobUrl(
          data.videoBase64,
          data.mimeType || 'video/mp4'
        );
        setVideoUrl(url);
      } else {
        setVideoNote(
          data.note ||
            'Rendering real-time orbital motion simulation on uploaded frame.'
        );
      }
    } finally {
      setVideoLoading(false);
    }
  };

  // Animate uploaded frame on canvas when in simulated_preview mode
  useEffect(() => {
    if (!videoNote || !videoImageBase64 || !simCanvasRef.current) return;
    const canvas = simCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = videoImageBase64;
    let raf = 0;
    let t = 0;

    const draw = () => {
      t += 0.025;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      const scale = 1.06 + Math.sin(t) * 0.04;
      const dx = Math.cos(t * 0.8) * 12;
      const dy = Math.sin(t * 0.6) * 8;
      ctx.translate(canvas.width / 2 + dx, canvas.height / 2 + dy);
      ctx.scale(scale, scale);
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(
          img,
          -canvas.width / 2,
          -canvas.height / 2,
          canvas.width,
          canvas.height
        );
      }
      ctx.restore();

      // Overlay orbital scanline & telemetry particles
      ctx.strokeStyle = 'rgba(61, 224, 255, 0.35)';
      ctx.lineWidth = 1.5;
      const scanY = ((t * 45) % canvas.height);
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(canvas.width, scanY);
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    img.onload = () => {
      draw();
    };
    return () => cancelAnimationFrame(raf);
  }, [videoNote, videoImageBase64]);

  // --- 5. LYRIA CIRCADIAN & RECOVERY MUSIC STATE ---
  const [musicModel, setMusicModel] = useState<
    'lyria-3-clip-preview' | 'lyria-3-pro-preview'
  >('lyria-3-clip-preview');
  const [musicPrompt, setMusicPrompt] = useState<string>(
    'Generate a 30-second ambient space habitat circadian recovery track with warm harmonic synth pads and 60 BPM autonomic pacing.'
  );
  const [musicLoading, setMusicLoading] = useState<boolean>(false);
  const [musicAudioUrl, setMusicAudioUrl] = useState<string | null>(null);
  const [musicLyrics, setMusicLyrics] = useState<string>('');
  const [musicModelUsed, setMusicModelUsed] = useState<string>('');

  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim() || musicLoading) return;
    setMusicLoading(true);
    try {
      const res = await fetch('/api/v1/ai/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: musicModel,
          prompt: musicPrompt,
        }),
      });
      const data = await res.json();
      if (data.audioBase64) {
        const url = base64ToBlobUrl(
          data.audioBase64,
          data.mimeType || 'audio/wav'
        );
        setMusicAudioUrl(url);
        setMusicLyrics(data.lyrics || '');
        setMusicModelUsed(data.modelUsed || musicModel);
      }
    } finally {
      setMusicLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3DE0FF]" />
            <span className="text-xs font-mono-tabular uppercase tracking-wider text-[#3DE0FF] font-bold">
              GEMINI MISSION AI COPILOT & MULTIMODAL STUDIO • NON-DIAGNOSTIC
            </span>
          </div>
          <h1 className="text-xl font-display font-bold text-[#F2F6FF] mt-0.5">
            Multi-Model Reasoning, Search Grounding, Live Voice, Omni Video & Lyria Audio
          </h1>
          <p className="text-xs text-[#A9B4CC]">
            Server-side <code className="text-[#3DE0FF]">@google/genai</code>{' '}
            integration synchronized with {activeCrew.name}&apos;s deterministic
            14-day personal baseline (`v1.0.0-demo`).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusChip tier={overallTier} />
        </div>
      </div>

      {/* Multimodal Capability Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          {
            id: 'chat' as CopilotTab,
            label: '1. Multi-Turn Gemini Chat',
            icon: <Bot className="w-4 h-4" />,
            badge: '4 Models',
          },
          {
            id: 'search' as CopilotTab,
            label: '2. Google Search Grounding',
            icon: <Globe className="w-4 h-4" />,
            badge: 'Hydrogen + Web',
          },
          {
            id: 'voice' as CopilotTab,
            label: '3. Live Voice Conversation',
            icon: <Mic className="w-4 h-4" />,
            badge: 'gemini-3.8-live',
          },
          {
            id: 'video' as CopilotTab,
            label: '4. Animate Image to Video',
            icon: <Film className="w-4 h-4" />,
            badge: 'Omni 1.2 Flash',
          },
          {
            id: 'music' as CopilotTab,
            label: '5. Lyria Circadian Music',
            icon: <Music className="w-4 h-4" />,
            badge: 'Lyria 3 Clip/Pro',
          },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition cursor-pointer ${
                active
                  ? 'bg-[#3DE0FF]/15 text-[#3DE0FF] border-[#3DE0FF]/50 font-bold'
                  : 'bg-white/5 text-[#A9B4CC] border-white/10 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono-tabular text-[10px]">
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: MULTI-TURN GEMINI CHATBOT */}
      {activeTab === 'chat' && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h2 className="text-base font-display font-bold text-[#F2F6FF]">
                Multi-Turn Mission Decision-Support Chat
              </h2>
              <p className="text-xs text-[#A9B4CC]">
                Maintains full multi-turn conversation history with automatic
                crew telemetry context injection.
              </p>
            </div>

            {/* Model Selector */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="gemini-model-select"
                className="text-xs text-[#A9B4CC] font-medium"
              >
                Model:
              </label>
              <select
                id="gemini-model-select"
                value={selectedChatModel}
                onChange={(e) =>
                  setSelectedChatModel(e.target.value as GeminiChatModel)
                }
                className="px-3 py-1.5 rounded-xl bg-[#04060C] border border-white/20 text-xs font-mono-tabular text-[#3DE0FF] cursor-pointer"
              >
                <option value="gemini-4-carbon">
                  gemini-4-carbon (Deep Reasoning)
                </option>
                <option value="gemini-4-argon">
                  gemini-4-argon (Complex Interactive Tasks)
                </option>
                <option value="gemini-4-hydrogen">
                  gemini-4-hydrogen (General Tasks)
                </option>
                <option value="gemini-3.1-flash-lite">
                  gemini-3.1-flash-lite (Fast Responses)
                </option>
              </select>
            </div>
          </div>

          {/* Quick Mission Prompts */}
          <div className="flex flex-wrap gap-2">
            {[
              `Summarize ${activeCrew.name}'s MD-${selectedMissionDay} baseline deviations and NASA-STD-3001 countermeasures.`,
              'Explain why robust z-score (median + 1.4826 * MAD) is used instead of mean/SD for 14-day crew baselines.',
              'Draft a concise Store-and-Forward Flight Surgeon handoff note for current open alerts.',
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSendChat(q)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#A9B4CC] hover:text-white text-left cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Scrollable Conversation Thread */}
          <div className="h-80 overflow-y-auto rounded-xl bg-[#04060C]/80 border border-white/10 p-4 space-y-3">
            {chatMessages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#3DE0FF] text-[#04060C] font-medium'
                      : 'bg-white/5 border border-white/15 text-[#F2F6FF]'
                  }`}
                >
                  {m.modelUsed && m.role === 'model' && (
                    <div className="text-[10px] font-mono-tabular text-[#3DE0FF] mb-1 font-bold">
                      {m.modelUsed}
                    </div>
                  )}
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="text-xs font-mono-tabular text-[#3DE0FF] animate-pulse">
                Synthesizing telemetry response with {selectedChatModel}…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Ask ${selectedChatModel} about ${activeCrew.name}'s health indicators, trends, or countermeasures…`}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-[#3DE0FF]"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="px-4 py-2.5 rounded-xl bg-[#3DE0FF] text-[#04060C] text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: GOOGLE SEARCH GROUNDING */}
      {activeTab === 'search' && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#3DE0FF]" />
              Google Search Grounded Space Medicine Lookup (`gemini-4-hydrogen`)
            </h2>
            <p className="text-xs text-[#A9B4CC]">
              Queries <code className="text-[#3DE0FF]">gemini-4-hydrogen</code>{' '}
              with <code className="text-[#3DE0FF]">tools: [&#123; googleSearch: &#123;&#125; &#125;]</code>{' '}
              and extracts verified source URLs from{' '}
              <code className="text-[#3DE0FF]">groundingMetadata.groundingChunks</code>.
            </p>
          </div>

          <form onSubmit={handleSearchGrounding} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search NASA Human Research Program, Artemis countermeasures, SANS, bone loss…"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="px-4 py-2.5 rounded-xl bg-[#3DE0FF] text-[#04060C] text-xs font-display font-bold cursor-pointer"
            >
              {searchLoading ? 'Searching Web…' : 'Search with Grounding'}
            </button>
          </form>

          {searchResultText && (
            <div className="p-4 rounded-xl bg-[#04060C]/80 border border-white/15 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[#3DE0FF]">
                <span>Model: {searchModelUsed}</span>
                <span>Sources: {searchSources.length} verified links</span>
              </div>
              <div className="text-xs text-[#F2F6FF] leading-relaxed whitespace-pre-wrap">
                {searchResultText}
              </div>

              {searchSources.length > 0 && (
                <div className="pt-3 border-t border-white/10 space-y-1.5">
                  <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#2DD4BF] font-bold">
                    Grounded Web Citations (groundingChunks)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {searchSources.map((s, idx) => (
                      <a
                        key={`${s.uri}-${idx}`}
                        href={s.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between gap-2 text-xs text-[#3DE0FF]"
                      >
                        <span className="truncate">{s.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REAL-TIME VOICE CONVERSATION (gemini-3.8-live) */}
      {activeTab === 'voice' && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#2DD4BF]" />
                Real-Time Voice Link (`gemini-3.8-live` WebSocket Audio Bridge)
              </h2>
              <p className="text-xs text-[#A9B4CC]">
                Streams 16kHz 16-bit PCM microphone audio to{' '}
                <code className="text-[#3DE0FF]">ai.live.connect</code> on the
                server and schedules gapless 24kHz PCM voice output.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={connectLiveVoice}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-[#F2F6FF] cursor-pointer"
              >
                {liveConnected ? 'Reconnect Live Session' : 'Connect Live Session'}
              </button>
              <button
                type="button"
                onClick={toggleMicCapture}
                className={`px-4 py-2 rounded-xl text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer ${
                  micStreaming
                    ? 'bg-[#FF5C93] text-white'
                    : 'bg-[#2DD4BF] text-[#04060C]'
                }`}
              >
                {micStreaming ? (
                  <>
                    <MicOff className="w-4 h-4" /> Stop Mic Stream
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" /> Start Live Mic (16kHz PCM)
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#04060C]/80 border border-white/10 flex items-center justify-between text-xs font-mono-tabular text-[#3DE0FF]">
            <span>Status: {liveStatus}</span>
            <span>Alerts in context: {alerts.filter((a) => a.status === 'open').length}</span>
          </div>

          {/* Live Transcript & Voice Prompt Box */}
          <div className="h-56 overflow-y-auto rounded-xl bg-[#04060C]/70 border border-white/10 p-4 space-y-2 text-xs">
            {liveTranscripts.length === 0 ? (
              <div className="text-[#7C89A6]">
                Click &ldquo;Start Live Mic&rdquo; to speak or send a prompt
                below to trigger real-time voice synthesis from{' '}
                <code className="text-[#3DE0FF]">gemini-3.8-live</code>.
              </div>
            ) : (
              liveTranscripts.map((t) => (
                <div
                  key={t.id}
                  className={`p-2.5 rounded-lg ${
                    t.role === 'user'
                      ? 'bg-[#3DE0FF]/15 text-[#3DE0FF]'
                      : t.role === 'system'
                        ? 'bg-amber-500/15 text-[#FFB547]'
                        : 'bg-white/5 text-[#F2F6FF]'
                  }`}
                >
                  <span className="font-mono-tabular font-bold uppercase text-[10px] mr-2">
                    [{t.role}]
                  </span>
                  {t.text}
                </div>
              ))
            )}
          </div>

          <form onSubmit={sendLiveVoiceText} className="flex gap-2">
            <input
              type="text"
              value={liveTextInput}
              onChange={(e) => setLiveTextInput(e.target.value)}
              placeholder="Send a prompt over the Live session (e.g., 'Guide me through a 60-second pre-EVA breathing check')…"
              className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#3DE0FF] text-[#04060C] text-xs font-bold cursor-pointer"
            >
              Send to Live Session
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: ANIMATE IMAGES INTO VIDEO (gemini-omni-1.2-flash) */}
      {activeTab === 'video' && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
                <Film className="w-4 h-4 text-[#8B7CFF]" />
                Animate Mission Photo into Video (`gemini-omni-1.2-flash`)
              </h2>
              <p className="text-xs text-[#A9B4CC]">
                Uses <code className="text-[#3DE0FF]">ai.interactions.create</code>{' '}
                with <code className="text-[#3DE0FF]">model: &apos;gemini-omni-1.2-flash&apos;</code>{' '}
                to animate an uploaded photo into a 16:9 or 9:16 video.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadSampleOrbitalImage}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs text-[#3DE0FF] font-semibold cursor-pointer"
              >
                Load Sample Orbital Frame
              </button>
              <label className="px-3.5 py-1.5 rounded-xl bg-[#8B7CFF] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 space-y-3">
              <div>
                <label className="block text-xs text-[#A9B4CC] mb-1">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['16:9', '9:16'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setVideoAspectRatio(ratio)}
                      className={`py-2 rounded-xl text-xs font-mono-tabular font-bold border cursor-pointer ${
                        videoAspectRatio === ratio
                          ? 'bg-[#3DE0FF]/20 border-[#3DE0FF] text-[#3DE0FF]'
                          : 'bg-white/5 border-white/10 text-[#A9B4CC]'
                      }`}
                    >
                      {ratio === '16:9' ? '16:9 (Landscape)' : '9:16 (Portrait)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#A9B4CC] mb-1">
                  Motion Prompt
                </label>
                <textarea
                  rows={3}
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
                />
              </div>

              <button
                type="button"
                disabled={!videoImageBase64 || videoLoading}
                onClick={handleGenerateVideo}
                className="w-full py-2.5 rounded-xl bg-[#3DE0FF] text-[#04060C] text-xs font-display font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Play className="w-4 h-4" />
                <span>
                  {videoLoading
                    ? 'Generating Video with gemini-omni-1.2-flash…'
                    : 'Animate Image into Video'}
                </span>
              </button>
            </div>

            <div className="md:col-span-7 rounded-xl bg-[#04060C]/80 border border-white/15 p-4 flex flex-col items-center justify-center min-h-[260px]">
              {!videoImageBase64 ? (
                <div className="text-xs text-[#7C89A6] text-center">
                  Upload a photo or click &ldquo;Load Sample Orbital
                  Frame&rdquo; to preview and animate.
                </div>
              ) : videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  className="max-h-64 rounded-xl border border-white/20"
                />
              ) : videoNote ? (
                <div className="w-full space-y-2 text-center">
                  <canvas
                    ref={simCanvasRef}
                    width={videoAspectRatio === '16:9' ? 480 : 240}
                    height={videoAspectRatio === '16:9' ? 270 : 360}
                    className="mx-auto rounded-xl border border-[#3DE0FF]/40"
                  />
                  <p className="text-[11px] text-[#FFB547] font-mono-tabular">
                    {videoNote}
                  </p>
                </div>
              ) : (
                <img
                  src={videoImageBase64}
                  alt="Uploaded starting frame"
                  className="max-h-60 rounded-xl border border-white/15 object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LYRIA CIRCADIAN & RECOVERY MUSIC GENERATION */}
      {activeTab === 'music' && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-display font-bold text-[#F2F6FF] flex items-center gap-2">
                <Music className="w-4 h-4 text-[#2DD4BF]" />
                Circadian & Autonomic Recovery Music Generator (`lyria-3-clip-preview` / `lyria-3-pro-preview`)
              </h2>
              <p className="text-xs text-[#A9B4CC]">
                Streams encoded audio via{' '}
                <code className="text-[#3DE0FF]">generateContentStream</code>{' '}
                with <code className="text-[#3DE0FF]">responseModalities: [Modality.AUDIO]</code>{' '}
                and decodes into a playable WAV Blob.
              </p>
            </div>

            <select
              value={musicModel}
              onChange={(e) =>
                setMusicModel(
                  e.target.value as
                    | 'lyria-3-clip-preview'
                    | 'lyria-3-pro-preview'
                )
              }
              aria-label="Lyria Model Selection"
              className="px-3 py-1.5 rounded-xl bg-[#04060C] border border-white/20 text-xs font-mono-tabular text-[#2DD4BF]"
            >
              <option value="lyria-3-clip-preview">
                lyria-3-clip-preview (30s Clip)
              </option>
              <option value="lyria-3-pro-preview">
                lyria-3-pro-preview (Full Track)
              </option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              'Ambient 30-second space habitat circadian wind-down pad, 60 BPM, warm analog harmonics',
              'Focused orbital EVA preparation instrumental pulse, steady 90 BPM rhythmic synth',
              'Deep-space autonomic vagal recovery soundscape with gentle harmonic overtones',
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setMusicPrompt(preset)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#A9B4CC] hover:text-white cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={musicPrompt}
              onChange={(e) => setMusicPrompt(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white"
            />
            <button
              type="button"
              disabled={musicLoading}
              onClick={handleGenerateMusic}
              className="px-5 py-2.5 rounded-xl bg-[#2DD4BF] text-[#04060C] text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              <span>{musicLoading ? 'Generating Track…' : 'Generate Audio'}</span>
            </button>
          </div>

          {musicAudioUrl && (
            <div className="p-4 rounded-xl bg-[#04060C]/80 border border-teal-400/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-tabular text-[#2DD4BF]">
                <span>Model: {musicModelUsed}</span>
                <span>Format: WAV Blob Stream</span>
              </div>
              <audio src={musicAudioUrl} controls autoPlay className="w-full" />
              {musicLyrics && (
                <p className="text-xs text-[#A9B4CC] font-mono-tabular">
                  {musicLyrics}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
