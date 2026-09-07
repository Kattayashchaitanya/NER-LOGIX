import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer } from '@/components/map/MapContainer';
import { Notification } from '@/components/ui/Notification';
import { Button } from '@/components/ui/Button';
import { DriverVehicleSelector } from '@/components/ui/DriverVehicleSelector';
import { DEMO_ROUTES, LOCATIONS, DEMO_TRIP } from '@/data/demo';
import { formatEta } from '@/utils';
import { useAppStore } from '@/store/appStore';
import { useNetworkStore, getReactiveDisplayRoute } from '@/store/networkStore';
import { getPendingIncidents, updateIncidentSyncStatus } from '@/utils/idb';
import {
  Navigation,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronRight,
  RotateCw,
  Warehouse,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function NetworkStateDisplay({
  networkStatus,
  pendingIncidentsCount,
}: {
  networkStatus: 'online' | 'offline' | 'syncing';
  pendingIncidentsCount: number;
}) {
  const configs = {
    online: { icon: <Wifi className="w-4 h-4" />, label: 'Network Connected', color: 'text-[#16a34a]', bg: 'bg-[#f0fdf4]' },
    offline: { icon: <WifiOff className="w-4 h-4" />, label: 'Network Unavailable — Offline Mode', color: 'text-[#dc2626]', bg: 'bg-[#fef2f2]' },
    syncing: { icon: <RefreshCw className="w-4 h-4 animate-spin" />, label: 'Reconnected — Synchronizing...', color: 'text-[#d97706]', bg: 'bg-[#fffbeb]' },
  };
  const cfg = configs[networkStatus];
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={networkStatus}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.2 }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border ${cfg.color} ${cfg.bg}`}
      >
        {cfg.icon}
        {cfg.label}
        {pendingIncidentsCount > 0 && networkStatus === 'offline' && (
          <span className="ml-2 px-1.5 py-0.5 bg-[#dc2626] text-white rounded-full text-[10px]">
            {pendingIncidentsCount} queued
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function NavigationView() {
  const {
    networkStatus,
    setNetworkStatus,
    selectedRouteId,
    selectedCustomRoute,
    pendingIncidentsCount,
    setPendingIncidentsCount,
    selectedDriverVehicleId,
  } = useAppStore();
  const navigate = useNavigate();

  const activeVehicles = useNetworkStore((state) => state.activeVehicles);
  const activeIncidents = useNetworkStore((state) => state.activeIncidents);
  const pickupRequests = useNetworkStore((state) => state.pickupRequests);
  const rerouteVehicle = useNetworkStore((state) => state.rerouteVehicle);
  const requestEmergencyPickup = useNetworkStore((state) => state.requestEmergencyPickup);

  const driverVehicle =
    activeVehicles.find((v) => v.id === selectedDriverVehicleId) ||
    activeVehicles.find((v) => v.id === 'AS-01-J-4422') ||
    activeVehicles[0];

  const isDriverDisrupted = Boolean(driverVehicle?.affectedByDisruptionId);
  const driverRerouted = driverVehicle?.rerouteStatus === 'active';
  const reactiveRoute = driverVehicle ? getReactiveDisplayRoute(driverVehicle) : undefined;

  const nl02Vehicle = activeVehicles.find((v) => v.id === 'NL-02-C-3391');
  const nl02InFallback =
    Boolean(nl02Vehicle) &&
    (nl02Vehicle?.rerouteStatus === 'no_alternative' || nl02Vehicle?.status === 'emergency_pickup');
  const emergencyVehicle =
    driverVehicle &&
    (driverVehicle.rerouteStatus === 'no_alternative' || driverVehicle.status === 'emergency_pickup')
      ? driverVehicle
      : nl02InFallback
        ? nl02Vehicle
        : undefined;

  const emergencyRequest = emergencyVehicle
    ? pickupRequests.find((r) => r.vehicleId === emergencyVehicle.id)
    : undefined;

  const activeRoute =
    selectedCustomRoute ||
    (driverVehicle?.plannedRouteId
      ? Object.values(DEMO_ROUTES).find((r) => r.id === driverVehicle.plannedRouteId)
      : undefined) ||
    DEMO_TRIP.routes.find((r) => r.id === selectedRouteId) ||
    DEMO_ROUTES.saferRoute;

  const navRoutes = driverRerouted && reactiveRoute
    ? [activeRoute, reactiveRoute]
    : [activeRoute];
  const displayEta = driverRerouted && driverVehicle?.etaMinutes
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

  const [justSyncedCount, setJustSyncedCount] = useState(0);
  const [reroutingInProgress, setReroutingInProgress] = useState(false);

  useEffect(() => {
    getPendingIncidents().then((incidents) => setPendingIncidentsCount(incidents.length));
  }, [setPendingIncidentsCount]);

  const simulateOffline = () => {
    setNetworkStatus('offline');
  };

  const simulateSync = async () => {
    setNetworkStatus('syncing');
    const pending = await getPendingIncidents();
    for (const inc of pending) {
      await updateIncidentSyncStatus(inc.id, 'pending_verification');
    }
    setTimeout(() => {
      setNetworkStatus('online');
      setPendingIncidentsCount(0);
      setJustSyncedCount(pending.length);
      setTimeout(() => setJustSyncedCount(0), 5000);
    }, 2000);
  };

  const handleStartReroute = () => {
    if (!driverVehicle) return;
    setReroutingInProgress(true);
    setTimeout(() => {
      rerouteVehicle(driverVehicle.id);
      setReroutingInProgress(false);
    }, 800);
  };

  return (
    <div className="h-full flex flex-col bg-[#f8f8f7]">
      {/* Cockpit Top Bar */}
      <div className="px-6 py-3 bg-white border-b border-[#e4e4e3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[#2563eb]">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-bold text-[#1a1a19]">Turn-by-Turn Guidance</h1>
              <DriverVehicleSelector id="nav-driver-vehicle-selector" compact />
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#8a8a87] mt-0.5">
              <span>{driverRerouted ? (driverVehicle?.rerouteFromLabel || 'Current position') : (driverVehicle?.origin || DEMO_TRIP.origin.shortName)}</span>
              <ChevronRight className="w-3 h-3" />
              <span>{driverVehicle?.destination || DEMO_TRIP.destination.shortName}</span>
              <span className="mx-1">·</span>
              <span className="font-medium text-[#2563eb]">
                {driverRerouted ? `Alternate Corridor Active (via ${driverVehicle?.rerouteTo || 'Alternate Route'})` : activeRoute.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NetworkStateDisplay networkStatus={networkStatus} pendingIncidentsCount={pendingIncidentsCount} />
          {networkStatus === 'online' ? (
            <Button size="sm" variant="outline" onClick={simulateOffline} iconLeft={<WifiOff className="w-3.5 h-3.5" />}>
              Simulate Offline
            </Button>
          ) : networkStatus === 'offline' ? (
            <Button size="sm" variant="primary" onClick={simulateSync} iconLeft={<RefreshCw className="w-3.5 h-3.5" />}>
              Restore Network
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Map */}
        <div className="flex-1 relative h-80 lg:h-full border-b lg:border-b-0 lg:border-r border-[#e4e4e3]">
          <MapContainer
            center={[25.7, 93.2]}
            zoom={7}
            routes={navRoutes}
            selectedRouteId={reactiveRoute?.id || activeRoute.id}
            incidents={activeIncidents}
            originMarker={{ latlng: [originLocation.lat, originLocation.lng], label: `${driverVehicle?.origin || 'Guwahati'} Hub` }}
            destinationMarker={{ latlng: [destLocation.lat, destLocation.lng], label: `${driverVehicle?.destination || 'Imphal'} Hub` }}
            vehicles={driverVehicle ? [driverVehicle] : []}
            userRole="driver"
            onRerouteVehicle={handleStartReroute}
          />

          {/* Offline Banner pill */}
          <AnimatePresence>
            {networkStatus === 'offline' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]"
              >
                <div className="bg-[#1a1a19]/95 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full font-medium shadow-lg flex items-center gap-2 border border-white/10">
                  <WifiOff className="w-3.5 h-3.5 text-[#f87171]" />
                  Operating in Offline Autonomous Mode (IndexedDB Cached)
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tactical Nav info panel */}
        <div className="w-full lg:w-96 xl:w-[410px] border-l border-[#e4e4e7] bg-white overflow-y-auto shrink-0 flex flex-col divide-y divide-[#e4e4e7]">
          {/* ETA & distance banner */}
          <div className="p-5 bg-[#fafafa]">
            <p className="text-xs font-bold text-[#71717a] uppercase tracking-wider mb-2.5">Live Trip Telemetry</p>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-[#71717a] font-bold">Estimated ETA</span>
                </div>
                <p className="text-2xl font-extrabold text-[#18181b] tracking-tight tabular-nums">
                  {formatEta(displayEta)}
                </p>
                {driverRerouted && (
                  <p className="text-xs text-blue-700 font-bold mt-1">Detour adjusted</p>
                )}
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-[#71717a] font-bold">Distance</span>
                </div>
                <p className="text-2xl font-extrabold text-[#18181b] tracking-tight tabular-nums">
                  {activeRoute.distanceKm} km
                </p>
                <p className="text-xs text-[#71717a] font-medium mt-1">Mountain Corridor</p>
              </div>
            </div>
          </div>

          {/* Tactical Alerts & Action Trigger */}
          <div className="p-5 flex-1 space-y-3">
            <p className="text-xs font-bold text-[#71717a] uppercase tracking-wider">Corridor Conditions & Actions</p>
            <div className="space-y-3">
              {/* Direct Driver Reroute Action Card */}
              {isDriverDisrupted && !driverRerouted && (
                <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-sm space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-rose-950">Road Disruption Ahead</p>
                      <p className="text-xs text-rose-900 mt-1 font-medium">
                        {driverVehicle?.impactReason || 'Corridor blocked by incident ahead. Alternate route is ready.'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="md"
                    variant="primary"
                    className="w-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white min-h-[44px] cursor-pointer shadow-xs"
                    onClick={handleStartReroute}
                    disabled={reroutingInProgress}
                    iconLeft={reroutingInProgress ? <RotateCw className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  >
                    {reroutingInProgress ? 'Calculating...' : 'Start Reroute from Current Position'}
                  </Button>
                </div>
              )}

              {driverRerouted && driverVehicle && (
                <Notification
                  type="info"
                  title="Detour Active"
                  message={`${driverVehicle.rerouteFromLabel || 'Current Position'} → ${driverVehicle.rerouteTo || driverVehicle.destination || DEMO_TRIP.destination.shortName}. Alternate corridor active.`}
                  visible
                />
              )}

              {driverVehicle?.rerouteStatus === 'no_alternative' && (
                <Notification
                  type="error"
                  title="No Alternate Route"
                  message={`${driverVehicle.id}: Planned corridor is blocked. No alternate route is available from current position.`}
                  visible
                />
              )}

              {emergencyVehicle && emergencyVehicle.rerouteStatus === 'no_alternative' && !emergencyRequest && emergencyVehicle.recommendedGodownId && (
                <div className="space-y-3 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm">
                  <Notification
                    type="error"
                    title="Emergency Supply Continuity"
                    message={`Route blocked. No viable alternate corridor. Relief storage godown available for ${emergencyVehicle.id}.`}
                    visible
                  />
                  <Button
                    size="md"
                    variant="danger"
                    className="w-full font-bold min-h-[44px] cursor-pointer"
                    onClick={() => requestEmergencyPickup(emergencyVehicle.id)}
                    iconLeft={<Warehouse className="w-4 h-4" />}
                  >
                    Request Emergency Pickup
                  </Button>
                </div>
              )}

              {emergencyRequest?.status === 'requested' && (
                <Notification
                  type="warning"
                  title="Emergency Pickup Requested"
                  message={`${emergencyRequest.vehicleId}: Pickup location: ${emergencyRequest.godownName}. Awaiting contractor dispatch.`}
                  visible
                />
              )}

              {(emergencyRequest?.status === 'dispatched' || emergencyRequest?.status === 'approved') && (
                <Notification
                  type="success"
                  title="Pickup Approved"
                  message={`Supplies available at ${emergencyRequest.godownName}. Destination: ${emergencyRequest.destination}. Relief transit dispatched.`}
                  visible
                />
              )}

              {justSyncedCount > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                  <Notification
                    type="success"
                    title="Incidents Synced"
                    message="Field hazard reports uploaded to SDMA verification queue."
                    visible
                  />
                </motion.div>
              )}
            </div>
          </div>

          {/* Offline Status checklist */}
          <div className="p-5 bg-[#fafafa]">
            <p className="text-xs font-bold text-[#71717a] uppercase tracking-wider mb-2.5">Offline Field Readiness</p>
            <div className="space-y-2">
              {[
                { label: 'Corridor vector cached', available: true },
                { label: 'Base map tiles', available: true },
                { label: 'Offline hazard storage (IDB)', available: true },
                { label: 'SDMA cloud link', available: networkStatus === 'online' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs font-medium">
                  <span className="text-[#52525b]">{item.label}</span>
                  <span className={item.available ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                    {item.available ? '✓ Ready' : '✗ Offline'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Dock */}
          <div className="p-5 space-y-3 bg-white">
            <Button
              variant="danger"
              size="md"
              className="w-full text-xs font-bold min-h-[44px] cursor-pointer shadow-xs"
              onClick={() => navigate('/driver/report')}
              iconLeft={<AlertTriangle className="w-4 h-4" />}
            >
              Report Hazard from Field
            </Button>
            <Button
              variant="outline"
              size="md"
              className="w-full text-xs font-bold min-h-[44px] cursor-pointer border-[#e4e4e7] hover:bg-zinc-50 text-[#18181b]"
              onClick={() => {
                useAppStore.getState().setTripState({ isJourneyActive: false, activeTripId: null, selectedRouteId: null, isOfflineReady: false });
                navigate('/driver');
              }}
            >
              End Journey & Return to Cockpit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
