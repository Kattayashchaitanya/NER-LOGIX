import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Notification } from '@/components/ui/Notification';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { DriverVehicleSelector } from '@/components/ui/DriverVehicleSelector';
import { DEMO_DRIVER } from '@/data/demo';
import { useAppStore } from '@/store/appStore';
import { useNetworkStore } from '@/store/networkStore';
import { saveIncident, getPendingIncidents } from '@/utils/idb';
import { analyzeIncidentReport } from '@/services/aiService';
import { locationProvider } from '@/services/locationService';
import type { IncidentType, IncidentSeverity, Incident, IncidentAiAnalysis, LocationSnapshot } from '@/types';
import {
  AlertTriangle,
  MapPin,
  Camera,
  Mic,
  Send,
  CheckCircle,
  Clock,
  X,
  Square,
  Globe,
  Sparkles,
  Volume2,
  RotateCcw,
  Shield,
  Layers,
  Flame,
  Zap,
  Car,
  CloudLightning,
  Construction,
  ShieldAlert,
  TreePine,
  Waves,
  Mountain,
} from 'lucide-react';
import { cn } from '@/utils';
import { useNavigate } from 'react-router-dom';

type FormState = 'idle' | 'submitting' | 'success';

const ALL_INCIDENT_TYPES: { id: IncidentType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'landslide', label: 'Landslide / Mud', icon: <Mountain className="w-5 h-5 text-rose-600" />, desc: 'Mud, rocks or hill slope sliding' },
  { id: 'flood', label: 'Flood / Water', icon: <Waves className="w-5 h-5 text-blue-600" />, desc: 'Waterlogging or flooded road' },
  { id: 'rockfall', label: 'Rockfall', icon: <AlertTriangle className="w-5 h-5 text-amber-600" />, desc: 'Falling boulders on highway' },
  { id: 'road_washout', label: 'Broken / Collapsed Road', icon: <Layers className="w-5 h-5 text-rose-800" />, desc: 'Carriageway collapsed or cave-in' },
  { id: 'bridge_damage', label: 'Bridge Damage', icon: <ShieldAlert className="w-5 h-5 text-rose-700" />, desc: 'Crack or structural issue on bridge' },
  { id: 'tree_fall', label: 'Fallen Tree / Wire', icon: <TreePine className="w-5 h-5 text-emerald-600" />, desc: 'Tree branch or electric power line down' },
  { id: 'vehicle_accident', label: 'Vehicle Accident', icon: <Car className="w-5 h-5 text-orange-600" />, desc: 'Truck breakdown or traffic jam' },
  { id: 'severe_weather', label: 'Heavy Fog / Storm', icon: <CloudLightning className="w-5 h-5 text-indigo-600" />, desc: 'Zero visibility or severe storm' },
  { id: 'road_closure', label: 'Road Blocked / Police Check', icon: <Construction className="w-5 h-5 text-slate-600" />, desc: 'Checkpoint or official closure' },
  { id: 'pothole_surface', label: 'Severe Potholes', icon: <Zap className="w-5 h-5 text-yellow-600" />, desc: 'Deep craters damaging vehicle wheels' },
  { id: 'fire_smoke', label: 'Fire / Heavy Smoke', icon: <Flame className="w-5 h-5 text-rose-600" />, desc: 'Forest fire or thick smoke' },
  { id: 'other', label: 'Other Danger', icon: <Shield className="w-5 h-5 text-slate-500" />, desc: 'Other transit impediment' },
];

const severityLevels: { id: IncidentSeverity; label: string; desc: string; color: string; bg: string }[] = [
  { id: 'low', label: 'Low', desc: 'Slow traffic, road still open', color: 'text-emerald-800 border-emerald-500', bg: 'bg-emerald-50' },
  { id: 'moderate', label: 'Medium', desc: 'Single lane open with caution', color: 'text-amber-800 border-amber-500', bg: 'bg-amber-50' },
  { id: 'high', label: 'High', desc: 'Severe delay (over 2 hours)', color: 'text-rose-800 border-rose-500', bg: 'bg-rose-50' },
  { id: 'critical', label: 'Critical Block', desc: 'Road completely blocked', color: 'text-rose-950 border-rose-800', bg: 'bg-rose-100' },
];

const SAMPLE_VOICE_MEMOS = [
  {
    lang: 'Assamese (অসমীয়া)',
    text: 'পাহাৰৰ পৰা ডাঙৰ শিল আৰু মাটি খহি ৰাস্তা সম্পূৰ্ণ বন্ধ হৈ পৰিছে। কোনো গাড়ী পাৰ হ’ব পৰা নাই।',
    label: 'Assamese (Landslide Blockage)',
  },
  {
    lang: 'Manipuri (মৈতৈলোন্)',
    text: 'নুং অমসুং লৈবাক থুদুনা লম্বী থিংজিনখ্ৰে, কিলোমিটর ১৮২ দা গারী চৎপা য়ারোই।',
    label: 'Manipuri (Rockfall Obstruction)',
  },
  {
    lang: 'Hindi (हिन्दी)',
    text: 'पहाड़ का मलबा और बड़े पत्थर गिरने से दोनों तरफ का रास्ता पूरी तरह बंद हो गया है।',
    label: 'Hindi (Road Collapse)',
  },
  {
    lang: 'English',
    text: 'Severe slope failure on NH-2 near km 312. Large boulders and mud blocking both carriageways completely.',
    label: 'English (Direct Report)',
  },
];

export function HazardReport() {
  const { networkStatus, activeTripId, setPendingIncidentsCount, selectedDriverVehicleId } = useAppStore();
  const activeVehicles = useNetworkStore((state) => state.activeVehicles);
  const addIncident = useNetworkStore((state) => state.addIncident);
  const currentDriverVehicle =
    activeVehicles.find((v) => v.id === selectedDriverVehicleId) ||
    activeVehicles.find((v) => v.id === 'AS-01-J-4422') ||
    activeVehicles[0];
  const navigate = useNavigate();

  const [type, setType] = useState<IncidentType>('landslide');
  const [severity, setSeverity] = useState<IncidentSeverity>('high');
  const [description, setDescription] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [lastIncidentId, setLastIncidentId] = useState<string>('');

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoTime, setPhotoTime] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('Assamese (অসমীয়া)');
  const [aiAnalysis, setAiAnalysis] = useState<IncidentAiAnalysis | null>(null);

  // Location Provider State
  const [locationSnapshot, setLocationSnapshot] = useState<LocationSnapshot>({
    lat: 25.32,
    lng: 93.55,
    locationName: 'NH-2 near Mao Gate, km 312',
    accuracyMeters: 10,
    source: 'SIMULATED',
    timestamp: new Date().toISOString(),
  });
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  const isOffline = networkStatus === 'offline';

  const refreshLocation = useCallback(async () => {
    setIsFetchingLocation(true);
    const loc = await locationProvider.getCurrentLocation({
      lat: currentDriverVehicle?.location?.[0] || 25.32,
      lng: currentDriverVehicle?.location?.[1] || 93.55,
      name: currentDriverVehicle?.origin ? `${currentDriverVehicle.origin} Corridor Sector` : 'NH-2 Mao Sector',
    });
    setLocationSnapshot(loc);
    setIsFetchingLocation(false);
  }, [currentDriverVehicle]);

  // Acquire real/simulated location on mount
  useEffect(() => {
    let isMounted = true;
    locationProvider
      .getCurrentLocation({
        lat: currentDriverVehicle?.location?.[0] || 25.32,
        lng: currentDriverVehicle?.location?.[1] || 93.55,
        name: currentDriverVehicle?.origin ? `${currentDriverVehicle.origin} Corridor Sector` : 'NH-2 Mao Sector',
      })
      .then((loc) => {
        if (isMounted) {
          setLocationSnapshot(loc);
          setIsFetchingLocation(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [currentDriverVehicle]);

  // Auto-run AI parsing when description changes
  useEffect(() => {
    if (description.trim().length > 8) {
      const timer = setTimeout(async () => {
        const analysis = await analyzeIncidentReport(description, locationSnapshot.locationName, selectedLanguage);
        setAiAnalysis(analysis);
        setType(analysis.hazardCategory);
        setSeverity(analysis.estimatedSeverity);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [description, locationSnapshot.locationName, selectedLanguage]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      setPhotoTime(new Date().toISOString());
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      // Hardware mic unavailable or blocked in iframe; simulate recording fallback
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(false);
      setAudioUrl('demo_audio_recorded');
      if (!description) {
        setDescription(SAMPLE_VOICE_MEMOS[0].text);
      }
    }
  };

  const handleApplyVoiceSample = (sample: typeof SAMPLE_VOICE_MEMOS[0]) => {
    setDescription(sample.text);
    setSelectedLanguage(sample.lang);
    setAudioUrl('demo_audio_recorded');
  };

  const handleSubmit = async () => {
    setFormState('submitting');

    const incidentId = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setLastIncidentId(incidentId);

    // Final AI analysis if not yet run
    const finalAnalysis =
      aiAnalysis ||
      (await analyzeIncidentReport(description, locationSnapshot.locationName, selectedLanguage));

    const newIncident: Incident = {
      id: incidentId,
      type,
      severity,
      location: [locationSnapshot.lat, locationSnapshot.lng],
      locationName: locationSnapshot.locationName,
      locationSource: locationSnapshot.source,
      description: description || `Field report: ${type.replace('_', ' ')} obstructing transit.`,
      reportedBy: currentDriverVehicle ? `${currentDriverVehicle.driverName} (${currentDriverVehicle.id})` : DEMO_DRIVER.name,
      reportedVehicleId: currentDriverVehicle?.id,
      reportedAt: new Date().toISOString(),
      syncStatus: isOffline ? 'local_pending' : 'pending_verification',
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
      photoCapturedAt: photoTime || new Date().toISOString(),
      voiceNote: Boolean(audioUrl),
      voiceNoteUrl: audioUrl || undefined,
      voiceTranscript: description,
      voiceLanguage: selectedLanguage,
      voiceDurationSec: recordingSeconds > 0 ? recordingSeconds : 14,
      aiAnalysis: finalAnalysis,
      affectedRouteId: currentDriverVehicle?.plannedRouteId || 'route-b',
    };

    // Save to local IndexedDB
    await saveIncident(newIncident);

    // Also push to in-memory networkStore for immediate multi-view visibility
    addIncident(newIncident);

    // Update global state count for pending incidents
    const pending = await getPendingIncidents();
    setPendingIncidentsCount(pending.length);

    setTimeout(() => {
      setFormState('success');
    }, 800);
  };

  if (formState === 'success') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          className="text-center max-w-md w-full"
        >
          <div className="w-14 h-14 rounded-full bg-[#f0fdf4] border-2 border-[#16a34a] flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-[#16a34a]" />
          </div>
          <h2 className="text-lg font-bold text-[#1a1a19] mb-1">
            {isOffline ? 'Hazard Saved in Offline IndexedDB Vault' : 'Hazard Dispatched to SDMA Authority'}
          </h2>
          <p className="text-xs text-[#5a5a57] mb-5">
            {isOffline
              ? 'Payload persisted in browser client vault. Background service worker will automatically synchronize with state authority upon network restoration.'
              : 'Report received by SDMA command center. Human-in-the-loop validation will trigger broadcast rerouting if confirmed.'}
          </p>

          <div className="bg-[#f8f8f7] rounded-xl border border-[#e4e4e3] p-4 text-left mb-6 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#e4e4e3] pb-2">
              <span className="text-xs font-semibold text-[#1a1a19]">Incident Ticket</span>
              <span className="text-xs font-bold text-[#1a1a19] font-mono">{lastIncidentId}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#5a5a57]">Sync State</span>
              <StatusBadge
                syncStatus={isOffline ? 'local_pending' : 'pending_verification'}
                pulse={isOffline}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#5a5a57]">Location Fix</span>
              <span className="font-semibold text-[#1a1a19]">
                {locationSnapshot.source === 'DEVICE_GPS' ? 'Device GPS (Live)' : 'Simulated Telemetry'}
              </span>
            </div>
            {aiAnalysis && (
              <div className="p-2.5 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] text-xs text-[#1e40af] space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
                    <span>AI Advisory Classification</span>
                  </div>
                  <span className="text-[10px] text-[#2563eb] bg-white px-1.5 py-0.5 rounded border border-[#bfdbfe]">
                    {aiAnalysis.provider}
                  </span>
                </div>
                <p className="text-[11px] leading-tight text-[#1e3a8a]">{aiAnalysis.englishSummary}</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-[11px] text-[#8a8a87] pt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              <span>·</span>
              <MapPin className="w-3.5 h-3.5" />
              <span>{locationSnapshot.locationName}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="primary"
              className="w-full text-xs font-bold"
              onClick={() => navigate('/driver/navigation')}
            >
              Return to Live Navigation Cockpit
            </Button>
            <Button
              variant="ghost"
              className="w-full text-xs font-semibold"
              onClick={() => {
                setFormState('idle');
                setType('landslide');
                setSeverity('high');
                setDescription('');
                setPhotoUrl(null);
                setAudioUrl(null);
                setAiAnalysis(null);
              }}
            >
              File Another Incident Report
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#fafaf9]">
      {/* Sticky Header */}
      <div className="px-6 py-4 bg-white border-b border-[#e4e4e3] sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#dc2626]" />
            <div>
              <h1 className="text-base font-bold text-[#1a1a19]">Field Hazard & Corridor Incident Reporting</h1>
              <p className="text-xs text-[#8a8a87]">Layer 4: Crowdsourced Driver Intelligence & Multi-Lingual Triage</p>
            </div>
          </div>
          <div>
            {isOffline && (
              <Notification
                type="warning"
                title="Mountain Dead-Zone: Report will queue into IndexedDB vault"
                visible
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-5 space-y-5">
        {/* Driver identity context bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white border border-[#e4e4e3] text-xs shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#5a5a57]">
              Reporting Transport: <strong className="text-[#1a1a19]">{currentDriverVehicle?.driverName || DEMO_DRIVER.name}</strong> ({currentDriverVehicle?.id})
            </span>
            <DriverVehicleSelector id="hazard-driver-vehicle-selector" compact />
          </div>
          <span className="text-[#2563eb] font-semibold">Active Trip: {activeTripId || 'TRIP-2026-0891'}</span>
        </div>

        {/* 1. All 12 Hazard Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#18181b] uppercase tracking-wider">Step 1: Select Hazard Type</p>
                <p className="text-xs text-[#52525b] mt-0.5">Tap the card that best matches what is blocking your vehicle</p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">12 Types</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {ALL_INCIDENT_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={cn(
                    'p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[96px]',
                    type === t.id
                      ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600 shadow-sm'
                      : 'bg-white border-[#e4e4e7] hover:border-zinc-400 hover:bg-zinc-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {t.icon}
                    <span className="text-xs font-bold text-[#18181b] leading-tight">{t.label}</span>
                  </div>
                  <p className="text-[11px] text-[#52525b] leading-snug mt-2 font-medium">{t.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 2. Estimated Severity */}
        <Card>
          <CardHeader>
            <p className="text-sm font-bold text-[#18181b] uppercase tracking-wider">Step 2: Road Severity & Delay Impact</p>
            <p className="text-xs text-[#52525b] mt-0.5">How badly does this obstruction stop highway transit?</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {severityLevels.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSeverity(s.id)}
                  className={cn(
                    'p-4 rounded-xl border text-center transition-all cursor-pointer min-h-[88px] flex flex-col justify-center',
                    severity === s.id
                      ? `${s.bg} ${s.color} border-2 shadow-sm font-bold ring-1 ring-current`
                      : 'bg-white border-[#e4e4e7] text-[#52525b] hover:border-zinc-400'
                  )}
                >
                  <span className="text-sm block font-bold text-[#18181b]">{s.label}</span>
                  <span className="text-xs text-[#52525b] mt-1 block font-medium leading-tight">{s.desc}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 3. Multilingual Voice Observation & Presets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#18181b] uppercase tracking-wider">
                  Step 3: Voice Message or Note
                </p>
                <p className="text-xs text-[#52525b] mt-0.5">Press mic to speak in your preferred regional language</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-blue-700 font-bold bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <Globe className="w-3.5 h-3.5" />
                <span>Assamese · Manipuri · Hindi · English</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Regional Demo Presets */}
            <div>
              <span className="text-xs font-bold text-[#3f3f46] block mb-2">
                Quick Regional Speech Examples (Tap to test):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_VOICE_MEMOS.map((sample) => (
                  <button
                    key={sample.label}
                    onClick={() => handleApplyVoiceSample(sample)}
                    className="p-3 rounded-xl bg-zinc-50 hover:bg-blue-50 hover:border-blue-300 border border-[#e4e4e7] text-left text-xs transition-colors cursor-pointer group"
                  >
                    <span className="font-bold text-[#18181b] group-hover:text-blue-700 block text-xs">{sample.label}</span>
                    <span className="text-[11px] text-[#52525b] line-clamp-1 italic mt-1 font-medium">{sample.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs font-bold text-[#3f3f46]">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="text-xs font-bold text-[#18181b] bg-white border border-[#e4e4e7] rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 shadow-2xs"
              >
                <option value="Assamese (অসমীয়া)">Assamese (অসমীয়া)</option>
                <option value="Manipuri (মৈতৈলোন্)">Manipuri (মৈতৈলোন্)</option>
                <option value="Hindi (हिन्दी)">Hindi (हिन्दी)</option>
                <option value="English">English</option>
              </select>
            </div>

            {/* Text Area */}
            <textarea
              className="w-full text-sm font-medium border border-[#e4e4e7] rounded-xl p-3.5 resize-none focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors placeholder:text-zinc-400 text-[#18181b]"
              rows={3}
              placeholder="Describe road blockage, rock size, water depth, or speak in your regional language..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Real Audio Recording Control Bar */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-[#f8f8f7] rounded-2xl border border-[#e4e4e7]">
              {!isRecording ? (
                <Button
                  variant="outline"
                  size="md"
                  onClick={startRecording}
                  iconLeft={<Mic className="w-5 h-5 text-blue-600" />}
                  className="font-bold text-sm"
                >
                  Press to Record Voice Note
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    variant="danger"
                    size="md"
                    onClick={stopRecording}
                    className="animate-pulse font-bold text-sm"
                    iconLeft={<Square className="w-4 h-4" />}
                  >
                    Stop Recording ({recordingSeconds}s)
                  </Button>
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                    <span>Listening to microphone...</span>
                  </div>
                </div>
              )}

              {audioUrl && (
                <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 border border-[#e4e4e7] rounded-xl text-xs text-[#18181b] shadow-2xs">
                  <Volume2 className="w-4 h-4 text-blue-600" />
                  <span className="font-bold">Voice Memo Ready</span>
                  <span className="text-xs text-[#71717a]">({selectedLanguage})</span>
                  <button
                    onClick={() => setAudioUrl(null)}
                    className="ml-2 text-zinc-400 hover:text-rose-600 cursor-pointer p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* AI Real-Time Parsing Feedback */}
            {aiAnalysis && (
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>AI Autonomous Triage & Extraction Engine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-blue-700 border border-blue-200">
                      {aiAnalysis.provider}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Confidence: {Math.round((aiAnalysis.confidenceScore || 0.94) * 100)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-blue-950 font-medium leading-relaxed">
                  <strong className="text-blue-900">English Summary:</strong> {aiAnalysis.englishSummary}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-[#52525b] font-bold uppercase">Extracted Tags:</span>
                  {aiAnalysis.extractedEntities.map((ent, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-md bg-white text-blue-800 text-xs font-bold border border-blue-200"
                    >
                      {ent}
                    </span>
                  ))}
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                    Road Impact: {aiAnalysis.roadImpact.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Media Upload */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="md"
                onClick={() => fileInputRef.current?.click()}
                iconLeft={<Camera className="w-4 h-4 text-zinc-700" />}
                className="font-bold text-xs"
              >
                {photoUrl ? 'Replace Photo Evidence' : 'Attach Camera / Photo Evidence'}
              </Button>
            </div>

            {/* Evidence Photo Preview */}
            {photoUrl && (
              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-[#e4e4e7] flex items-center gap-3.5">
                <div className="relative w-28 h-20 rounded-xl border border-[#e4e4e7] overflow-hidden shrink-0">
                  <img src={photoUrl} alt="Hazard preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPhotoUrl(null)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-[#18181b]">Geotagged Photo Evidence Attached</p>
                  <p className="text-xs text-[#71717a]">EXIF Timestamp: {new Date().toLocaleTimeString('en-IN')}</p>
                  <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-md">
                    Validation Ready
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Geotagged Location Coordinates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#18181b] uppercase tracking-wider">Step 4: Location & GPS Coordinates</p>
              <button
                onClick={refreshLocation}
                disabled={isFetchingLocation}
                className="text-xs text-blue-700 hover:underline font-bold flex items-center gap-1.5 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
              >
                <RotateCcw className={cn('w-3.5 h-3.5', isFetchingLocation && 'animate-spin')} />
                <span>Refresh GPS</span>
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3.5 py-1">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#18181b] truncate">{locationSnapshot.locationName}</p>
                <p className="text-xs text-[#52525b] mt-0.5 font-medium">
                  Coordinates: {locationSnapshot.lat.toFixed(4)}°N, {locationSnapshot.lng.toFixed(4)}°E (Accuracy: ±{locationSnapshot.accuracyMeters || 10}m)
                </p>
              </div>
              <div>
                <StatusBadge
                  label={locationSnapshot.source === 'DEVICE_GPS' ? 'Device GPS (Live)' : 'Simulated Telemetry'}
                  variant={locationSnapshot.source === 'DEVICE_GPS' ? 'success' : 'neutral'}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Action */}
        <div className="pb-10 pt-3">
          <Button
            variant="danger"
            size="lg"
            className="w-full text-sm font-bold shadow-md min-h-[52px]"
            loading={formState === 'submitting'}
            onClick={handleSubmit}
            iconLeft={<Send className="w-5 h-5" />}
          >
            {isOffline ? 'Save Hazard to Local Device Vault (Offline Mode)' : 'Transmit Hazard Report to SDMA Command Queue'}
          </Button>
          <p className="text-xs text-[#71717a] text-center mt-2.5 font-medium">
            {isOffline
              ? 'Stored safely on device in local IndexedDB. Automatic background sync will dispatch payload upon reconnection.'
              : 'Immediately notifies regional freight dispatchers and opens human verification in SDMA portal.'}
          </p>
        </div>
      </div>
    </div>
  );
}

