import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DEMO_TRIP, DEMO_ROUTES, LOCATIONS } from '@/data/demo';
import { Button } from '@/components/ui/Button';
import { MapContainer } from '@/components/map/MapContainer';
import { DriverVehicleSelector } from '@/components/ui/DriverVehicleSelector';
import { useAppStore } from '@/store/appStore';
import { useNetworkStore, getReactiveDisplayRoute } from '@/store/networkStore';
import { formatEta } from '@/utils';
import {
  Package,
  Thermometer,
  Navigation,
  Route,
  CloudRain,
  Mountain,
  RotateCw,
  CheckCircle2,
  Warehouse,
  ShieldCheck,
  Truck,
  Eye,
  AlertTriangle,
  Database,
} from 'lucide-react';

export function DriverDashboard() {
  const { isJourneyActive, selectedRouteId, selectedDriverVehicleId } = useAppStore();

  const activeVehicles = useNetworkStore((state) => state.activeVehicles);
  const activeIncidents = useNetworkStore((state) => state.activeIncidents);
  const roadSegments = useNetworkStore((state) => state.roadSegments);
  const godowns = useNetworkStore((state) => state.godowns);
  const rerouteVehicle = useNetworkStore((state) => state.rerouteVehicle);
  const requestEmergencyPickup = useNetworkStore((state) => state.requestEmergencyPickup);
  const syncFromIndexedDB = useNetworkStore((state) => state.syncFromIndexedDB);

  const [reroutingInProgress, setReroutingInProgress] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    syncFromIndexedDB();
  }, [syncFromIndexedDB]);

  // Derive active driver vehicle safely from selectedDriverVehicleId
  const driverVehicle =
    activeVehicles.find((v) => v.id === selectedDriverVehicleId) ||
    activeVehicles.find((v) => v.id === 'AS-01-J-4422') ||
    activeVehicles[0];

  const isDisrupted = Boolean(driverVehicle?.affectedByDisruptionId);
  const isRerouted = driverVehicle?.rerouteStatus === 'active';
  const hasNoAlternative = driverVehicle?.rerouteStatus === 'no_alternative';
  const isEmergencyPickup = driverVehicle?.status === 'emergency_pickup';

  // Base route respecting vehicle's planned corridor
  const activeRoute =
    (driverVehicle?.plannedRouteId
      ? Object.values(DEMO_ROUTES).find((r) => r.id === driverVehicle.plannedRouteId)
      : undefined) ||
    DEMO_TRIP.routes.find((r) => r.id === selectedRouteId) ||
    DEMO_ROUTES.saferRoute;

  const reactiveRoute = driverVehicle ? getReactiveDisplayRoute(driverVehicle) : undefined;
  const displayRoutes = isRerouted && reactiveRoute ? [activeRoute, reactiveRoute] : [activeRoute];
  const displayEta = isRerouted && driverVehicle?.etaMinutes
    ? driverVehicle.etaMinutes
    : (driverVehicle?.etaMinutes || activeRoute.etaMinutes);

  const originLocation = Object.values(LOCATIONS).find(
    (l) =>
      l.shortName.toLowerCase() === driverVehicle?.origin?.toLowerCase() ||
      l.name.toLowerCase().includes(driverVehicle?.origin?.toLowerCase() || '')
  ) || LOCATIONS.guwahati;

  const destLocation = Object.values(LOCATIONS).find(
    (l) =>
      l.shortName.toLowerCase() === driverVehicle?.destination?.toLowerCase() ||
      l.name.toLowerCase().includes(driverVehicle?.destination?.toLowerCase() || '')
  ) || LOCATIONS.imphal;

  const handleStartReroute = () => {
    if (!driverVehicle) return;
    setReroutingInProgress(true);
    setTimeout(() => {
      rerouteVehicle(driverVehicle.id);
      setReroutingInProgress(false);
      navigate('/driver/navigation');
    }, 850);
  };

  const handleEmergencyPickup = () => {
    if (!driverVehicle) return;
    requestEmergencyPickup(driverVehicle.id);
    navigate('/driver/navigation');
  };

  return (
    <div className="h-full flex flex-col bg-[#f8f8f7]">
      {/* Top Cockpit Header */}
      <div className="px-5 py-4 bg-white border-b border-[#e5e5e4] shrink-0 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                Driver Mode
              </span>
              <DriverVehicleSelector id="cockpit-driver-vehicle-selector" />
            </div>
            <div className="hidden md:block h-5 w-px bg-[#e5e5e4]" />
            <h1 className="text-base font-bold text-[#18181b] tracking-tight">
              {driverVehicle?.driverName} · {driverVehicle?.origin || 'Guwahati'} → {driverVehicle?.destination || 'Imphal'}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              size="md"
              variant={isJourneyActive ? 'primary' : 'outline'}
              onClick={() => navigate(isJourneyActive ? '/driver/navigation' : '/driver/trip')}
              iconLeft={isJourneyActive ? <Navigation className="w-4 h-4" /> : <Route className="w-4 h-4" />}
              className="cursor-pointer font-bold"
            >
              {isJourneyActive ? 'Active Navigation' : 'Plan Trip Route'}
            </Button>
            <Button
              size="md"
              variant="danger"
              onClick={() => navigate('/driver/report')}
              iconLeft={<AlertTriangle className="w-4 h-4" />}
              className="cursor-pointer bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Report Hazard
            </Button>
          </div>
        </div>

        {/* PRIMARY OPERATIONAL ACTION BANNER */}
        <div className="mt-3">
          <AnimatePresence mode="wait">
            {/* Case 1: Disrupted Ahead -> Reroute Recommendation */}
            {isDisrupted && !isRerouted && (
              <motion.div
                key="disrupted-banner"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-rose-950 uppercase tracking-wide">
                        Road Hazard Ahead · Intervention Suggested
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-600 text-white">
                        Action Required
                      </span>
                    </div>
                    <p className="text-sm text-rose-900 mt-1 font-medium">
                      {driverVehicle?.impactReason || 'NH-2 Mao Gate Landslide verified by SDMA. Corridor blocked.'}
                    </p>
                    <p className="text-xs text-rose-800 font-semibold mt-1">
                      Recommended: Safe mountain detour via Haflong / Lumding corridor available from your current position.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="md"
                    variant="outline"
                    onClick={() => navigate('/driver/trip')}
                    className="border-rose-300 text-rose-900 hover:bg-rose-100 cursor-pointer font-bold"
                  >
                    Compare Alternate
                  </Button>
                  <Button
                    size="md"
                    variant="primary"
                    onClick={handleStartReroute}
                    disabled={reroutingInProgress}
                    iconLeft={reroutingInProgress ? <RotateCw className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                    className="bg-rose-600 hover:bg-rose-700 text-white border-transparent cursor-pointer font-bold shadow-xs"
                  >
                    {reroutingInProgress ? 'Computing Route...' : 'Start Safe Detour'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Case 2: Reroute Active */}
            {isRerouted && (
              <motion.div
                key="rerouted-banner"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-blue-950 uppercase tracking-wide">
                        Reactive Reroute Active
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-600 text-white">
                        Avoiding Hazard
                      </span>
                    </div>
                    <p className="text-sm text-blue-900 mt-1 font-medium">
                      Diverting from {driverVehicle?.rerouteFromLabel || 'Current Position'} toward {DEMO_TRIP.destination.name}.
                    </p>
                    <p className="text-xs text-blue-800 font-semibold mt-1">
                      Updated ETA: {formatEta(displayEta)} (includes mountain bypass safety margin).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="md"
                    variant="primary"
                    onClick={() => navigate('/driver/navigation')}
                    iconLeft={<Navigation className="w-4 h-4" />}
                    className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-bold shadow-xs"
                  >
                    Continue Navigation
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Case 3: No Alternate Route Available */}
            {hasNoAlternative && (
              <motion.div
                key="no-alt-banner"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-amber-950 uppercase tracking-wide">
                        No Safe Alternative Corridor
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-600 text-white">
                        Emergency Fallback
                      </span>
                    </div>
                    <p className="text-sm text-amber-900 mt-1 font-medium">
                      Highway pass blocked. Emergency relief godown storage available nearby to preserve cold-chain cargo.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="md"
                    variant="danger"
                    onClick={handleEmergencyPickup}
                    iconLeft={<Warehouse className="w-4 h-4" />}
                    className="cursor-pointer font-bold"
                  >
                    Find Emergency Godown
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Case: Emergency Storage Authorized */}
            {isEmergencyPickup && (
              <motion.div
                key="emergency-pickup-banner"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
                        Emergency Storage & Buffer Authorized
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-600 text-white">
                        Secured
                      </span>
                    </div>
                    <p className="text-sm text-emerald-900 mt-1 font-medium">
                      Emergency godown allocation confirmed by Supply Contractor. Proceed to {driverVehicle?.destination || 'designated emergency facility'}.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="md"
                    variant="primary"
                    onClick={() => navigate('/driver/navigation')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent cursor-pointer font-bold shadow-xs"
                    iconLeft={<Navigation className="w-4 h-4" />}
                  >
                    Navigate to Emergency Godown
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Case 4: Normal Clean Journey */}
            {!isDisrupted && !isRerouted && !hasNoAlternative && !isEmergencyPickup && (
              <motion.div
                key="normal-banner"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
                        Highway Corridor Clear · Safe to Transit
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-600 text-white">
                        Nominal Risk
                      </span>
                    </div>
                    <p className="text-sm text-emerald-900 mt-1 font-medium">
                      No active road closures on route to {driverVehicle?.destination || DEMO_TRIP.destination.name}. Next checkpoint: {driverVehicle?.rerouteFromLabel || 'Nagaon Junction'}.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="md"
                    variant="primary"
                    onClick={() => navigate('/driver/navigation')}
                    iconLeft={<Navigation className="w-4 h-4" />}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer font-bold shadow-xs"
                  >
                    Start Live Navigation
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Cockpit Split: Map (Prominent) + Tactical Journey Card */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Prominent Geospatial Map Canvas */}
        <div className="flex-1 h-80 lg:h-full relative border-b lg:border-b-0 lg:border-r border-[#e4e4e3]">
          <MapContainer
            center={[25.75, 93.2]}
            zoom={7}
            routes={displayRoutes}
            selectedRouteId={reactiveRoute?.id || activeRoute.id}
            incidents={activeIncidents}
            vehicles={driverVehicle ? [driverVehicle] : []}
            godowns={godowns}
            userRole="driver"
            onRerouteVehicle={handleStartReroute}
            onRequestEmergencyPickup={handleEmergencyPickup}
            originMarker={{ latlng: [originLocation.lat, originLocation.lng], label: `${driverVehicle?.origin || 'Guwahati'} Hub` }}
            destinationMarker={{ latlng: [destLocation.lat, destLocation.lng], label: `${driverVehicle?.destination || 'Imphal'} Hub` }}
          />
        </div>

        {/* Focused Journey Console Panel */}
        <div className="w-full lg:w-96 xl:w-[410px] bg-white overflow-y-auto shrink-0 flex flex-col divide-y divide-[#e4e4e7]">
          {/* Section 1: Immediate Journey Progress */}
          <div className="p-5 space-y-3 bg-[#fafafa]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#71717a] uppercase tracking-wider">
                Current Journey State
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-[#e4e4e7] text-[#18181b] shadow-2xs">
                {isRerouted ? 'Detour Active' : isDisrupted ? 'Disrupted' : 'On Route'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-[#71717a] uppercase font-bold tracking-wider">Estimated Arrival</span>
                  <p className="text-2xl font-bold text-[#18181b] tracking-tight mt-0.5">{formatEta(displayEta)}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#71717a] uppercase font-bold tracking-wider">Total Distance</span>
                  <p className="text-base font-bold text-[#3f3f46] mt-0.5">{activeRoute.distanceKm} km</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#f4f4f5] flex items-center justify-between text-xs text-[#52525b]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Current Checkpoint:</span>
                </span>
                <span className="font-bold text-[#18181b]">
                  {driverVehicle?.rerouteFromLabel || (driverVehicle?.status === 'idle' ? `${driverVehicle?.origin || 'Guwahati'} Hub (Staged)` : 'En Route Corridor')}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Consignment & Cold-Chain */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#52525b]" />
                Cargo & Cold Chain
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Nominal
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f8f8f7] border border-[#e4e4e7] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#71717a] font-medium">Consignment:</span>
                <span className="font-bold text-[#18181b]">{driverVehicle?.cargoType || DEMO_TRIP.cargo.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#71717a] font-medium flex items-center gap-1">
                  <Thermometer className="w-4 h-4 text-blue-600" />
                  Cargo Temp:
                </span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {driverVehicle?.type.includes('Refrigerated') || driverVehicle?.cargoType?.includes('Vaccines') || driverVehicle?.cargoType?.includes('Pharma')
                    ? '4.2 °C (Cold Chain)'
                    : 'Ambient Controlled'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#71717a] font-medium">Vehicle Type:</span>
                <span className="font-semibold text-[#18181b]">{driverVehicle?.type || 'Refrigerated Truck'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Mountain Pass & Weather Context */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-1.5">
                <Mountain className="w-4 h-4 text-[#52525b]" />
                Mountain Corridor Status
              </span>
              <span className="text-xs font-semibold text-[#71717a]">Mao Pass Corridor</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-3 rounded-xl bg-[#f8f8f7] border border-[#e4e4e7]">
                <CloudRain className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                <p className="text-[11px] text-[#71717a] font-medium">Precipitation</p>
                <p className="font-bold text-[#18181b] text-sm mt-0.5">3.5 mm/h</p>
              </div>
              <div className="p-3 rounded-xl bg-[#f8f8f7] border border-[#e4e4e7]">
                <Eye className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                <p className="text-[11px] text-[#71717a] font-medium">Visibility</p>
                <p className="font-bold text-[#18181b] text-sm mt-0.5">6.2 km</p>
              </div>
              <div className="p-3 rounded-xl bg-[#f8f8f7] border border-[#e4e4e7]">
                <Mountain className="w-5 h-5 mx-auto text-[#52525b] mb-1" />
                <p className="text-[11px] text-[#71717a] font-medium">Elevation</p>
                <p className="font-bold text-[#18181b] text-sm mt-0.5">1,650 m</p>
              </div>
            </div>
          </div>

          {/* Section 4: Upcoming Highway Segments */}
          <div className="p-5 space-y-2.5">
            <span className="text-xs font-bold text-[#71717a] uppercase tracking-wider">
              Corridor Segments Ahead
            </span>
            <div className="space-y-2">
              {roadSegments.slice(0, 3).map((seg) => (
                <div key={seg.id} className="p-3 rounded-xl border border-[#e4e4e7] bg-white flex items-center justify-between text-xs shadow-2xs">
                  <div>
                    <p className="font-bold text-[#18181b]">{seg.name}</p>
                    <p className="text-[11px] text-[#71717a] font-medium mt-0.5">{seg.fromLocation} → {seg.toLocation}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase ${
                      seg.status === 'blocked'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : seg.status === 'caution'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {seg.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Offline Resilience Status */}
          <div className="p-5 bg-[#fafafa]">
            <div className="flex items-center gap-2.5 text-xs text-[#52525b]">
              <Database className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">
                Offline Cache: <strong className="text-[#18181b]">Active & Ready</strong> (Map tiles & emergency shelters stored on device)
              </span>
            </div>
            <p className="text-[11px] text-[#71717a] mt-1">
              Route corridors & SOS numbers function seamlessly even when mobile towers lose signal in mountain passes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
