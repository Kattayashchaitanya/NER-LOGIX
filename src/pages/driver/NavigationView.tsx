import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer } from '@/components/map/MapContainer';
import { Notification } from '@/components/ui/Notification';
import { Button } from '@/components/ui/Button';
import { DEMO_ROUTES, DEMO_INCIDENTS, LOCATIONS, DEMO_TRIP, DEMO_DRIVER } from '@/data/demo';
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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NetworkStateDisplayProps {
  networkStatus: 'online' | 'offline' | 'syncing';
  pendingIncidentsCount: number;
}

function NetworkStateDisplay({ networkStatus, pendingIncidentsCount }: NetworkStateDisplayProps) {
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
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium ${cfg.color} ${cfg.bg}`}
      >
        {cfg.icon}
        {cfg.label}
        {pendingIncidentsCount > 0 && networkStatus === 'offline' && (
          <span className="ml-2 px-1.5 py-0.5 bg-[#dc2626] text-white rounded-full text-[10px]">
            {pendingIncidentsCount} pending
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function NavigationView() {
  const { networkStatus, setNetworkStatus, selectedRouteId, pendingIncidentsCount, setPendingIncidentsCount } = useAppStore();
  const navigate = useNavigate();
  const driverVehicle = useNetworkStore((state) =>
    state.activeVehicles.find((v) => v.id === DEMO_DRIVER.vehicleId)
  );
  const pickupRequests = useNetworkStore((state) => state.pickupRequests);
  const activeVehicles = useNetworkStore((state) => state.activeVehicles);
  const requestEmergencyPickup = useNetworkStore((state) => state.requestEmergencyPickup);
  const nl02Vehicle = activeVehicles.find((v) => v.id === 'NL-02-C-3391');
  const nl02InFallback =
    Boolean(nl02Vehicle) &&
    (nl02Vehicle?.rerouteStatus === 'no_alternative' || nl02Vehicle?.status === 'emergency_pickup');
  const emergencyVehicle = nl02InFallback
    ? nl02Vehicle
    : driverVehicle &&
        (driverVehicle.rerouteStatus === 'no_alternative' || driverVehicle.status === 'emergency_pickup')
      ? driverVehicle
      : undefined;
  const emergencyRequest = emergencyVehicle
    ? pickupRequests.find((r) => r.vehicleId === emergencyVehicle.id)
    : undefined;
  const activeRoute = DEMO_TRIP.routes.find(r => r.id === selectedRouteId) || DEMO_ROUTES.saferRoute;
  const driverRerouted = driverVehicle?.rerouteStatus === 'active';
  const reactiveRoute = driverVehicle ? getReactiveDisplayRoute(driverVehicle) : undefined;
  const navRoutes = driverRerouted && reactiveRoute
    ? [activeRoute, reactiveRoute]
    : [activeRoute];
  const displayEta = driverRerouted && driverVehicle?.etaMinutes
    ? driverVehicle.etaMinutes
    : activeRoute.etaMinutes;

  // Sync state just for visual feedback (since networkStatus handles the actual online/offline/syncing)
  const [justSyncedCount, setJustSyncedCount] = useState(0);

  useEffect(() => {
    // Check pending count on load
    getPendingIncidents().then((incidents) => setPendingIncidentsCount(incidents.length));
  }, [setPendingIncidentsCount]);

  const simulateOffline = () => {
    setNetworkStatus('offline');
  };

  const simulateSync = async () => {
    setNetworkStatus('syncing');
    
    // Process local queue
    const pending = await getPendingIncidents();
    for (const inc of pending) {
      await updateIncidentSyncStatus(inc.id, 'pending_verification');
    }
    
    setTimeout(() => {
      setNetworkStatus('online');
      setPendingIncidentsCount(0);
      setJustSyncedCount(pending.length);
      setTimeout(() => setJustSyncedCount(0), 5000);
    }, 2500);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-3 bg-white border-b border-[#e4e4e3] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Navigation className="w-4 h-4 text-[#2563eb]" />
          <div>
            <h1 className="text-sm font-semibold text-[#1a1a19]">Navigation</h1>
            <div className="flex items-center gap-1 text-[11px] text-[#8a8a87]">
              <span>{driverRerouted ? (driverVehicle?.rerouteFromLabel || 'Current position') : DEMO_TRIP.origin.shortName}</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span>{DEMO_TRIP.destination.shortName}</span>
              <span className="mx-1">·</span>
              <span>{driverRerouted ? 'Alternate from current position' : activeRoute.label}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NetworkStateDisplay networkStatus={networkStatus} pendingIncidentsCount={pendingIncidentsCount} />
          {networkStatus === 'online' ? (
            <Button size="sm" variant="ghost" onClick={simulateOffline} iconLeft={<WifiOff className="w-3.5 h-3.5" />}>
              Simulate Offline
            </Button>
          ) : networkStatus === 'offline' ? (
            <Button size="sm" variant="ghost" onClick={simulateSync} iconLeft={<RefreshCw className="w-3.5 h-3.5" />}>
              Restore Network
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[25.5, 93.0]}
            zoom={7}
            routes={navRoutes}
            selectedRouteId={reactiveRoute?.id || activeRoute.id}
            incidents={DEMO_INCIDENTS.slice(0, 2)}
            originMarker={{ latlng: [LOCATIONS.guwahati.lat, LOCATIONS.guwahati.lng], label: 'Guwahati Logistics Hub' }}
            destinationMarker={{ latlng: [LOCATIONS.imphal.lat, LOCATIONS.imphal.lng], label: 'Imphal District Hospital' }}
            vehicles={driverVehicle ? [driverVehicle] : []}
          />

          {/* Offline overlay */}
          <AnimatePresence>
            {networkStatus === 'offline' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]"
              >
                <div className="bg-[#1a1a19] text-white text-xs px-4 py-2 rounded-full font-medium shadow-lg flex items-center gap-2">
                  <WifiOff className="w-3.5 h-3.5" />
                  Offline Mode
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav info panel */}
        <div className="w-72 border-l border-[#e4e4e3] bg-white overflow-y-auto shrink-0">
          {/* ETA & distance */}
          <div className="px-4 py-3 border-b border-[#e4e4e3]">
            <p className="text-[10px] text-[#8a8a87] uppercase tracking-wide mb-2">Route Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-[#8a8a87]" />
                  <span className="text-[10px] text-[#8a8a87]">ETA</span>
                </div>
                <p className="text-xl font-semibold text-[#1a1a19] tabular-nums">
                  {formatEta(displayEta)}
                </p>
                {driverRerouted && (
                  <p className="text-[10px] text-[#2563eb] font-medium mt-0.5">Updated from current position</p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#8a8a87]" />
                  <span className="text-[10px] text-[#8a8a87]">Distance</span>
                </div>
                <p className="text-xl font-semibold text-[#1a1a19] tabular-nums">
                  {activeRoute.distanceKm} km
                </p>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="px-4 py-3 border-b border-[#e4e4e3]">
            <p className="text-[10px] text-[#8a8a87] uppercase tracking-wide mb-2">Alerts</p>
            <div className="space-y-2">
              {driverRerouted && driverVehicle && (
                <Notification
                  type="error"
                  title="Route updated"
                  message={`${driverVehicle.rerouteFromLabel || 'Current position'} → ${driverVehicle.rerouteTo || DEMO_TRIP.destination.shortName}. NH-2 Mao Gate is blocked. Alternate route recommended from your current position. New ETA ${driverVehicle.etaMinutes ? formatEta(driverVehicle.etaMinutes) : ''}.`}
                  visible
                />
              )}
              {driverVehicle?.rerouteStatus === 'no_alternative' && (
                <Notification
                  type="error"
                  title="No alternate route"
                  message="NH-2 Mao Gate is blocked. No alternate corridor is available from your current position."
                  visible
                />
              )}
              {emergencyVehicle && emergencyVehicle.rerouteStatus === 'no_alternative' && !emergencyRequest && emergencyVehicle.recommendedGodownId && (
                <div className="space-y-2">
                  <Notification
                    type="error"
                    title="Emergency supply continuity"
                    message={`Route blocked. No viable alternate corridor. Pickup location recommended for ${emergencyVehicle.id}. Awaiting request.`}
                    visible
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => requestEmergencyPickup(emergencyVehicle.id)}
                  >
                    Request Emergency Pickup
                  </Button>
                </div>
              )}
              {emergencyRequest?.status === 'requested' && (
                <Notification
                  type="warning"
                  title="Emergency pickup requested"
                  message={`${emergencyRequest.vehicleId}: Pickup location: ${emergencyRequest.godownName}. Awaiting contractor approval.`}
                  visible
                />
              )}
              {(emergencyRequest?.status === 'dispatched' || emergencyRequest?.status === 'approved') && (
                <Notification
                  type="success"
                  title="Pickup approved"
                  message={`Supplies available at ${emergencyRequest.godownName}. Destination: ${emergencyRequest.destination}. Destination notified.`}
                  visible
                />
              )}
              <Notification
                type="warning"
                title="Flooding reported"
                message="Doyyang River Bridge — proceed with caution"
                visible
              />
              {justSyncedCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Notification
                    type="success"
                    title="Incident synced successfully."
                    message="Awaiting authority verification."
                    visible
                  />
                </motion.div>
              )}
            </div>
          </div>

          {/* Offline status */}
          <div className="px-4 py-3 border-b border-[#e4e4e3]">
            <p className="text-[10px] text-[#8a8a87] uppercase tracking-wide mb-2">Offline Status</p>
            <div className="space-y-1.5">
              {[
                { label: 'Route cached', available: true },
                { label: 'Map tiles', available: networkStatus !== 'offline' },
                { label: 'Hazard reporting', available: true },
                { label: 'SDMA sync', available: networkStatus === 'online' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="text-[#5a5a57]">{item.label}</span>
                  <span className={item.available ? 'text-[#16a34a]' : 'text-[#dc2626]'}>
                    {item.available ? '✓ Available' : '✗ Unavailable'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-3 space-y-2">
            <Button
              variant="danger"
              size="sm"
              className="w-full"
              onClick={() => navigate('/driver/report')}
              iconLeft={<AlertTriangle className="w-3.5 h-3.5" />}
            >
              Report Hazard
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                useAppStore.getState().setTripState({ isJourneyActive: false, activeTripId: null, selectedRouteId: null, isOfflineReady: false });
                navigate('/driver');
              }}
            >
              End Journey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
