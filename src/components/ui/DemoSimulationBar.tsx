import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkStore } from '@/store/networkStore';
import { useAppStore } from '@/store/appStore';
import {
  Sliders,
  WifiOff,
  Wifi,
  AlertTriangle,
  CloudRain,
  Warehouse,
  RotateCcw,
  PlayCircle,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Truck,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

const PITCH_SCRIPT = [
  {
    title: 'Step 1: Predictive Risk Route Selection',
    desc: 'Driver plans journey from Guwahati to Imphal. System compares Route A (18/100 Risk) vs Route B (82/100 Risk). Driver selects Route A for cargo safety.',
    role: 'driver' as const,
    path: '/driver/trip',
  },
  {
    title: 'Step 2: Pre-Trip Offline Bundle Download',
    desc: 'Driver caches map vector tiles, terrain waypoints, and multilingual audio alerts into IndexedDB for offline operation.',
    role: 'driver' as const,
    path: '/driver/trip',
  },
  {
    title: 'Step 3: Entering Mountain Dead-Zone (Offline)',
    desc: '4G/5G drops to zero bars. Service Worker transparently renders map and guidance using local hardware GPS and IndexedDB.',
    role: 'driver' as const,
    path: '/driver/navigation',
  },
  {
    title: 'Step 4: Field Hazard Reporting & Offline Queue',
    desc: 'Driver encounters fresh landslide at KM 182. Captures geotagged photo and records Assamese voice memo. Report queues locally in IndexedDB.',
    role: 'driver' as const,
    path: '/driver/report',
  },
  {
    title: 'Step 5: Reconnect & Automatic Cloud Sync',
    desc: 'Cresting mountain ridge restores momentary signal. Background Sync automatically uploads report to SDMA triage queue.',
    role: 'sdma' as const,
    path: '/sdma/incidents',
  },
  {
    title: 'Step 6: SDMA Human-in-the-Loop Verification',
    desc: 'District Disaster Officer inspects evidence, reviews AI transcription, and approves hazard pin. Enforces official road status.',
    role: 'sdma' as const,
    path: '/sdma/incidents',
  },
  {
    title: 'Step 7: Real-Time Rerouting from Current Position',
    desc: 'Approaching vehicles receive WebSocket alerts. Route recalculates dynamically from CURRENT position rather than original start point.',
    role: 'driver' as const,
    path: '/driver/navigation',
  },
  {
    title: 'Step 8: No Safe Route & Godown Fallback',
    desc: 'All alternate passes impassable (>85/100 risk). Vehicle safely diverted to Dimapur Emergency Relief Godown with contractor authorization.',
    role: 'contractor' as const,
    path: '/contractor',
  },
];

export function DemoSimulationBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [pitchStep, setPitchStep] = useState<number | null>(null);

  const { networkStatus, setNetworkStatus, setRole, role } = useAppStore();
  const disruptions = useNetworkStore((state) => state.disruptions);
  const addIncident = useNetworkStore((state) => state.addIncident);
  const verifyIncident = useNetworkStore((state) => state.verifyIncident);
  const updateRoadSegment = useNetworkStore((state) => state.updateRoadSegment);
  const requestEmergencyPickup = useNetworkStore((state) => state.requestEmergencyPickup);
  const rerouteVehicle = useNetworkStore((state) => state.rerouteVehicle);
  const resetToCleanState = useNetworkStore((state) => state.resetToCleanState);
  const weatherSpikeActive = useNetworkStore((state) => state.weatherSpikeActive);
  const setWeatherSpike = useNetworkStore((state) => state.setWeatherSpike);

  const navigate = useNavigate();

  // 1. Inject Landslide Blockage
  const handleInjectLandslide = async () => {
    const incId = `INC-2026-LANDSLIDE`;
    const newInc = {
      id: incId,
      type: 'landslide' as const,
      severity: 'critical' as const,
      location: [25.32, 93.55] as [number, number],
      locationName: 'NH-2 near Mao Gate, km 312',
      description: 'Major slope collapse after heavy rainfall. Both carriageways blocked by shale debris and boulders.',
      reportedBy: 'Arjun Baruah (Field Driver)',
      reportedAt: new Date().toISOString(),
      syncStatus: 'pending_verification' as const,
      voiceNote: true,
      voiceTranscript: 'Bhal boroxun hoi ase, rasta bondo hoi gose Mao Gateor osorot.',
      voiceLanguage: 'Assamese',
      affectedRouteId: 'route-b',
    };
    await addIncident(newInc);
    // Directly verify to trigger immediate network disruption broadcast
    await verifyIncident(incId, true, 'SDMA Command');
  };

  // 2. Weather Escalation (Cloudburst Spike)
  const handleSimulateWeatherSpike = () => {
    setWeatherSpike(!weatherSpikeActive);
  };

  // 3. Corridor Collapse -> Godown Fallback
  const handleTriggerCorridorCollapse = () => {
    updateRoadSegment('rd-001', { status: 'blocked', riskLevel: 'blocked' });
    requestEmergencyPickup('NL-02-C-3391');
  };

  // 4. Reset All Demo State
  const handleResetDemo = async () => {
    await resetToCleanState();
    setPitchStep(null);
    setNetworkStatus('online');
  };

  const executeStage = (stepIndex: number) => {
    const stage = PITCH_SCRIPT[stepIndex];
    if (!stage) return;
    setPitchStep(stepIndex);
    setRole(stage.role);

    switch (stepIndex) {
      case 0:
      case 1:
        navigate('/driver/trip');
        break;
      case 2:
        setNetworkStatus('offline');
        navigate('/driver/navigation');
        break;
      case 3:
        navigate('/driver/report');
        break;
      case 4:
        setNetworkStatus('online');
        navigate('/sdma/incidents');
        break;
      case 5:
        handleInjectLandslide();
        navigate('/sdma/incidents');
        break;
      case 6:
        rerouteVehicle('MN-04-B-1121');
        navigate('/driver/navigation');
        break;
      case 7:
        handleTriggerCorridorCollapse();
        navigate('/contractor');
        break;
      default:
        navigate(stage.path);
        break;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end pointer-events-auto">
      {/* Pitch Step Floating Guidance Modal */}
      <AnimatePresence>
        {pitchStep !== null && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="mb-3 w-96 max-w-[calc(100vw-2rem)] bg-[#1a1a19] text-white p-4 rounded-xl shadow-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#2563eb] text-white">
                SIH 2026 Jury Presentation Mode
              </span>
              <button
                onClick={() => setPitchStep(null)}
                className="text-white/60 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              {PITCH_SCRIPT[pitchStep].title}
            </h3>
            <p className="text-xs text-white/80 leading-relaxed mb-3">
              {PITCH_SCRIPT[pitchStep].desc}
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <span className="text-white/60 text-[11px]">
                Stage {pitchStep + 1} of {PITCH_SCRIPT.length}
              </span>
              <div className="flex items-center gap-1.5">
                {pitchStep > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-white border-white/20 hover:bg-white/10 text-xs py-1 h-7"
                    onClick={() => executeStage(pitchStep - 1)}
                  >
                    Previous
                  </Button>
                )}
                {pitchStep < PITCH_SCRIPT.length - 1 ? (
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-[#2563eb] text-xs py-1 h-7 font-semibold"
                    onClick={() => executeStage(pitchStep + 1)}
                  >
                    Next Stage →
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-[#16a34a] text-xs py-1 h-7 font-semibold"
                    onClick={() => setPitchStep(null)}
                  >
                    Complete ✓
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Collapsible Demo Controller Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="mb-2 w-84 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-[#e5e5e4] p-3.5 text-xs divide-y divide-[#f4f4f5] isolate z-[9999]"
          >
            {/* Header */}
            <div className="pb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[#18181b]">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sliders className="w-3.5 h-3.5" />
                </div>
                <span>Simulation & Demo Hub</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                SIH Evaluator
              </span>
            </div>

            {/* Guided Pitch Walkthrough */}
            <div className="py-2.5 space-y-2">
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#71717a]">
                Evaluator Walkthrough
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full bg-[#18181b] hover:bg-[#27272a] text-white flex items-center justify-center gap-2 shadow-xs cursor-pointer py-2 font-semibold"
                onClick={() => executeStage(0)}
              >
                <PlayCircle className="w-4 h-4 text-sky-400" />
                <span>Launch 8-Step Storyline</span>
              </Button>
            </div>

            {/* Manual Simulation Triggers */}
            <div className="py-2.5 space-y-2">
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#71717a]">
                Live Disruption Injections
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[11px] h-8 justify-start px-2 hover:bg-rose-50 hover:text-rose-700 border-rose-200 cursor-pointer"
                  onClick={handleInjectLandslide}
                  title="Injects a major slope failure on NH-2 Mao Gate and immediately notifies fleet"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mr-1" />
                  <span className="truncate font-medium">NH-2 Landslide</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className={`text-[11px] h-8 justify-start px-2 border transition-all cursor-pointer ${
                    weatherSpikeActive
                      ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
                      : 'hover:bg-blue-50 hover:text-blue-700 border-blue-200'
                  }`}
                  onClick={handleSimulateWeatherSpike}
                  title="Simulates 45mm/h cloudburst over Karbi Anglong / Doyyang corridor"
                >
                  <CloudRain className={`w-3.5 h-3.5 shrink-0 mr-1 ${weatherSpikeActive ? 'text-white' : 'text-blue-600'}`} />
                  <span className="truncate font-medium">{weatherSpikeActive ? 'Cloudburst On' : 'Rain Surge'}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-[11px] h-8 justify-start px-2 hover:bg-orange-50 hover:text-orange-700 border-orange-200 cursor-pointer"
                  onClick={handleTriggerCorridorCollapse}
                  title="Collapses all alternative passes and routes heavy vehicle to nearest emergency godown"
                >
                  <Warehouse className="w-3.5 h-3.5 text-orange-600 shrink-0 mr-1" />
                  <span className="truncate font-medium">Godown Relief</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-[11px] h-8 justify-start px-2 cursor-pointer"
                  onClick={() =>
                    setNetworkStatus(networkStatus === 'online' ? 'offline' : 'online')
                  }
                  title="Toggles between Online cloud sync and Offline IndexedDB dead-zone cache"
                >
                  {networkStatus === 'online' ? (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-rose-600 shrink-0 mr-1" />
                      <span className="truncate font-medium">Drop 4G Signal</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0 mr-1" />
                      <span className="truncate font-medium">Restore 4G</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Role Switcher for Jury */}
            <div className="py-2.5 space-y-1.5">
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#71717a]">
                Quick Workspace
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { r: 'driver' as const, label: 'Driver', path: '/driver', icon: <Truck className="w-3.5 h-3.5" /> },
                  { r: 'dispatcher' as const, label: 'Ops', path: '/dispatcher', icon: <Activity className="w-3.5 h-3.5" /> },
                  { r: 'sdma' as const, label: 'SDMA', path: '/sdma', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                  { r: 'contractor' as const, label: 'Godown', path: '/contractor', icon: <Warehouse className="w-3.5 h-3.5" /> },
                ].map((item) => (
                  <button
                    key={item.r}
                    onClick={() => {
                      setRole(item.r);
                      navigate(item.path);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-semibold transition-all cursor-pointer ${
                      role === item.r
                        ? 'bg-[#18181b] text-white border-[#18181b] shadow-xs'
                        : 'bg-[#fafafa] hover:bg-[#f4f4f5] text-[#52525b] border-[#e5e5e4]'
                    }`}
                  >
                    {item.icon}
                    <span className="mt-1">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            <div className="pt-2.5 flex items-center justify-between text-[11px] text-[#71717a]">
              <span>Active Alerts: {disruptions.length}</span>
              <button
                onClick={handleResetDemo}
                className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 hover:underline cursor-pointer font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                Reset State
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 bg-[#18181b] text-white rounded-full shadow-lg hover:bg-[#27272a] transition-all text-xs font-semibold cursor-pointer border border-white/15"
      >
        <Sliders className="w-3.5 h-3.5 text-sky-400" />
        <span>Demo & Simulation</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 opacity-70" /> : <ChevronUp className="w-3.5 h-3.5 opacity-70" />}
      </button>
    </div>
  );
}
