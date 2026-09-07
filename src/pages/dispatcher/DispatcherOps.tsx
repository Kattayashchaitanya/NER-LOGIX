import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer } from '@/components/map/MapContainer';
import { MetricCard } from '@/components/ui/MetricCard';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DEMO_CORRIDORS, DEMO_ROUTES } from '@/data/demo';
import { useNetworkStore, getReactiveDisplayRoute, DEMO_PICKUP_QUANTITY, nearestLocationLabel } from '@/store/networkStore';
import { formatEta, formatTimeAgo, getIncidentTypeLabel, getVehicleStatusLabel } from '@/utils';
import { cn } from '@/utils';
import { Activity, AlertTriangle, Truck, Map, Navigation, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.04 } } },
  item: { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0, transition: { duration: 0.18 } } },
};

const statusColors: Record<string, string> = {
  on_route: 'text-[#2563eb]',
  idle: 'text-[#8a8a87]',
  disrupted: 'text-[#dc2626]',
  offline: 'text-[#8a8a87]',
  emergency_pickup: 'text-[#c2410c]',
};

export function DispatcherOps() {
  const activeVehicles = useNetworkStore((state) => state.activeVehicles);
  const activeIncidents = useNetworkStore((state) => state.activeIncidents);
  const godowns = useNetworkStore((state) => state.godowns);
  const pickupRequests = useNetworkStore((state) => state.pickupRequests);
  const syncFromIndexedDB = useNetworkStore((state) => state.syncFromIndexedDB);
  const rerouteVehicle = useNetworkStore((state) => state.rerouteVehicle);
  const recommendEmergencyGodown = useNetworkStore((state) => state.recommendEmergencyGodown);
  const requestEmergencyPickup = useNetworkStore((state) => state.requestEmergencyPickup);
  const approveEmergencyPickup = useNetworkStore((state) => state.approveEmergencyPickup);
  const declineEmergencyPickup = useNetworkStore((state) => state.declineEmergencyPickup);

  useEffect(() => {
    syncFromIndexedDB();
  }, [syncFromIndexedDB]);

  const affectedVehicles = activeVehicles.filter(
    (v) =>
      Boolean(v.affectedByDisruptionId) &&
      v.rerouteStatus !== 'active' &&
      v.status !== 'emergency_pickup'
  );
  const reroutedVehicles = activeVehicles.filter(
    (v) => v.rerouteStatus === 'active' || v.rerouteStatus === 'no_alternative'
  );
  const safeVehiclesCount = activeVehicles.filter((v) => !v.affectedByDisruptionId && v.riskLevel === 'low').length;
  const activeIncidentsCount = activeIncidents.filter((i) => i.syncStatus !== 'rejected').length;
  const reactiveMapRoutes = reroutedVehicles
    .map(getReactiveDisplayRoute)
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#e4e4e3]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-semibold text-[#1a1a19]">Operations Center</h1>
            <p className="text-xs text-[#8a8a87]">North Eastern Region — Fleet & Corridor Monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
            <span className="text-xs text-[#8a8a87]">Live</span>
          </div>
        </div>

        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <motion.div variants={stagger.item}>
            <MetricCard label="Active Vehicles" value={activeVehicles.length} subtext="Across NE corridors" icon={<Truck className="w-4 h-4" />} />
          </motion.div>
          <motion.div variants={stagger.item}>
            <MetricCard label="Active Incidents" value={`0${activeIncidentsCount}`} riskLevel={activeIncidentsCount > 0 ? "high" : "low"} icon={<AlertTriangle className="w-4 h-4" />} />
          </motion.div>
          <motion.div variants={stagger.item}>
            <MetricCard label="Regional Risk" value={affectedVehicles.length > 0 ? "High" : "Moderate"} riskLevel={affectedVehicles.length > 0 ? "high" : "moderate"} icon={<Activity className="w-4 h-4" />} />
          </motion.div>
          <motion.div variants={stagger.item}>
            <MetricCard label="Safe Vehicles" value={safeVehiclesCount} subtext={`${affectedVehicles.length} disrupted`} riskLevel={affectedVehicles.length > 0 ? "high" : "low"} />
          </motion.div>
        </motion.div>
      </div>

      {/* Main */}
      <div className="flex-1 flex min-h-0">
        {/* Map */}
        <div className="flex-1 min-w-0">
          <MapContainer
            center={[25.5, 93.0]}
            zoom={7}
            routes={[...Object.values(DEMO_ROUTES), ...reactiveMapRoutes]}
            selectedRouteId={reactiveMapRoutes[0]?.id}
            incidents={activeIncidents}
            vehicles={activeVehicles}
          />
        </div>

        {/* Right panels */}
        <div className="w-80 border-l border-[#e4e4e3] bg-white overflow-y-auto shrink-0 flex flex-col">
          {/* Disruption Impact section */}
          <div className={cn(
            "px-4 py-3 border-b",
            affectedVehicles.length > 0 ? "border-[#fecaca] bg-[#fff8f8]" : "border-[#e4e4e3]"
          )}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className={cn("w-3.5 h-3.5", affectedVehicles.length > 0 ? "text-[#dc2626]" : "text-[#16a34a]")} />
                <h2 className="text-xs font-semibold text-[#1a1a19] uppercase tracking-wide">
                  Disruption Impact
                </h2>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                affectedVehicles.length > 0
                  ? "bg-[#dc2626] text-white"
                  : "bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]"
              )}>
                {affectedVehicles.length > 0 ? `${affectedVehicles.length} Affected` : 'All Clear'}
              </span>
            </div>

            {affectedVehicles.length > 0 ? (
              <div className="space-y-2 mt-2.5">
                <p className="text-[11px] text-[#7f1d1d] font-medium leading-snug">
                  Active disruption detected. Downstream shipments flagged for intervention:
                </p>
                {affectedVehicles.map((v) => (
                  <div
                    key={v.id}
                    className="p-2.5 rounded-lg bg-white border border-[#fca5a5] shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div>
                        <span className="text-xs font-bold text-[#1a1a19]">{v.id}</span>
                        <span className="text-[11px] text-[#5a5a57] ml-1.5 font-medium">{v.driverName}</span>
                      </div>
                      <StatusBadge label="Disrupted" variant="danger" pulse />
                    </div>
                    {v.cargoType && (
                      <p className="text-[11px] text-[#374151] font-medium truncate mb-1">
                        📦 {v.cargoType}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-[#8a8a87]">
                      <span>{v.origin} → {v.destination}</span>
                      {v.etaMinutes && <span>ETA {formatEta(v.etaMinutes)}</span>}
                    </div>
                    <p className="text-[10px] text-[#7f1d1d] mt-1">
                      Blocked: NH-2 Mao Gate · planned {v.plannedRouteId === 'route-b' ? 'Route B' : v.plannedRouteId || 'route'}
                    </p>
                    {v.impactReason && (
                      <div className="mt-1.5 pt-1.5 border-t border-[#fee2e2] text-[10px] text-[#b91c1c] font-medium leading-tight">
                        ⚠️ {v.impactReason}
                      </div>
                    )}
                    {v.rerouteStatus === 'no_alternative' ? (
                      <div className="mt-2 space-y-2">
                        <p className="text-[10px] font-medium text-[#7f1d1d] bg-[#fef2f2] border border-[#fecaca] rounded px-2 py-1.5">
                          No alternate corridor from current position. NH-2 Mao Gate remains inaccessible.
                        </p>
                        {!v.recommendedGodownId && (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => recommendEmergencyGodown(v.id)}
                            iconLeft={<Warehouse className="w-3 h-3" />}
                          >
                            Find Emergency Godown
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => rerouteVehicle(v.id)}
                        iconLeft={<Navigation className="w-3 h-3" />}
                      >
                        Find Alternate
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#8a8a87] mt-1">
                No active disruptions impacting current shipments.
              </p>
            )}
          </div>

          {reroutedVehicles.some((v) => v.rerouteStatus === 'active') && (
            <div className="px-4 py-3 border-b border-[#bfdbfe] bg-[#f8fbff]">
              <div className="flex items-center gap-1.5 mb-2">
                <Navigation className="w-3.5 h-3.5 text-[#2563eb]" />
                <h2 className="text-xs font-semibold text-[#1a1a19] uppercase tracking-wide">
                  Reactive Reroute
                </h2>
              </div>
              <div className="space-y-2">
                {reroutedVehicles.filter((v) => v.rerouteStatus === 'active').map((v) => (
                  <div key={v.id} className="p-2.5 rounded-lg bg-white border border-[#bfdbfe]">
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <div>
                        <span className="text-xs font-bold text-[#1a1a19]">{v.id}</span>
                        <span className="text-[11px] text-[#5a5a57] ml-1.5">{v.driverName}</span>
                      </div>
                      <StatusBadge label="Rerouted" variant="info" />
                    </div>
                    <dl className="space-y-1 text-[10px]">
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#8a8a87]">From</dt>
                        <dd className="font-medium text-[#1a1a19] text-right">{v.rerouteFromLabel}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#8a8a87]">To</dt>
                        <dd className="font-medium text-[#1a1a19]">{v.rerouteTo || v.destination}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#8a8a87]">Avoiding</dt>
                        <dd className="font-medium text-[#b91c1c] text-right">NH-2 Mao Gate Segment</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#8a8a87]">Alternate</dt>
                        <dd className="font-medium text-[#1a1a19]">
                          {v.currentRoute === 'route-a' ? 'Route A — Safer' : v.currentRoute}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#8a8a87]">New ETA</dt>
                        <dd className="font-semibold text-[#1a1a19]">
                          {v.etaMinutes ? formatEta(v.etaMinutes) : '—'}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-1.5 pt-1.5 border-t border-[#dbeafe] text-[10px] text-[#1e40af] leading-tight">
                      Route begins from the vehicle's current position.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeVehicles.some((v) => v.rerouteStatus === 'no_alternative' && v.recommendedGodownId) && (
            <div className="px-4 py-3 border-b border-[#fed7aa] bg-[#fffbeb]">
              <div className="flex items-center gap-1.5 mb-2">
                <Warehouse className="w-3.5 h-3.5 text-[#c2410c]" />
                <h2 className="text-xs font-semibold text-[#1a1a19] uppercase tracking-wide">
                  Emergency Continuity
                </h2>
              </div>
              <div className="space-y-2">
                {activeVehicles
                  .filter((v) => v.rerouteStatus === 'no_alternative' && v.recommendedGodownId)
                  .map((v) => {
                    const godown = godowns.find((g) => g.id === v.recommendedGodownId);
                    const request = pickupRequests.find((r) => r.vehicleId === v.id);
                    return (
                      <div key={v.id} className="p-2.5 rounded-lg bg-white border border-[#fdba74]">
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <div>
                            <span className="text-xs font-bold text-[#1a1a19]">{v.id}</span>
                            <span className="text-[11px] text-[#5a5a57] ml-1.5">{v.driverName}</span>
                          </div>
                          <StatusBadge
                            label={
                              request?.status === 'dispatched'
                                ? 'Dispatched'
                                : request?.status === 'requested'
                                  ? 'Requested'
                                  : request?.status === 'declined'
                                    ? 'Declined'
                                    : 'No Alternate'
                            }
                            variant={
                              request?.status === 'dispatched'
                                ? 'success'
                                : request?.status === 'requested'
                                  ? 'warning'
                                  : 'danger'
                            }
                          />
                        </div>
                        <dl className="space-y-1 text-[10px]">
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#8a8a87]">Current position</dt>
                            <dd className="font-medium text-[#1a1a19] text-right">{nearestLocationLabel(v.location)}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#8a8a87]">Cargo</dt>
                            <dd className="font-medium text-[#1a1a19] text-right">{v.cargoType}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#8a8a87]">Destination</dt>
                            <dd className="font-medium text-[#1a1a19]">{v.destination}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#8a8a87]">Reason</dt>
                            <dd className="font-medium text-[#b91c1c] text-right">No viable alternate corridor</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#8a8a87]">Godown</dt>
                            <dd className="font-medium text-[#1a1a19] text-right">{godown?.name}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#8a8a87]">Distance</dt>
                            <dd className="font-medium text-[#1a1a19]">{v.recommendedGodownDistanceKm} km</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#8a8a87]">Available stock</dt>
                            <dd className="font-medium text-[#1a1a19]">{godown?.availableStock} units</dd>
                          </div>
                        </dl>

                        {!request && (
                          <Button
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => requestEmergencyPickup(v.id)}
                          >
                            Request Emergency Pickup
                          </Button>
                        )}

                        {request?.status === 'requested' && (
                          <div className="mt-2 space-y-1.5">
                            <p className="text-[10px] text-[#92400e] font-medium">
                              Emergency pickup requested. Waiting for contractor approval ({DEMO_PICKUP_QUANTITY} units).
                            </p>
                            <p className="text-[10px] text-[#8a8a87]">North East Logistics Contractor</p>
                            <div className="flex gap-1.5">
                              <Button size="sm" className="flex-1" onClick={() => approveEmergencyPickup(request.id)}>
                                Approve Pickup
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => declineEmergencyPickup(request.id)}>
                                Decline
                              </Button>
                            </div>
                          </div>
                        )}

                        {request?.status === 'dispatched' && (
                          <div className="mt-2 pt-2 border-t border-[#fed7aa] text-[10px] text-[#9a3412] leading-snug space-y-0.5">
                            <p className="font-semibold">Approved / Dispatched</p>
                            <p>Stock reserved: {request.quantity} units · Remaining: {godown?.availableStock} units</p>
                            <p>Destination notified — {request.destination} informed of emergency supply continuity.</p>
                            <p className="text-[#8a8a87]">{request.contractorName}</p>
                          </div>
                        )}

                        {request?.status === 'declined' && (
                          <p className="mt-2 text-[10px] font-medium text-[#7f1d1d]">Pickup declined by contractor.</p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Corridors */}
          <div className="px-4 py-3 border-b border-[#e4e4e3]">
            <div className="flex items-center gap-2 mb-3">
              <Map className="w-3.5 h-3.5 text-[#8a8a87]" />
              <h2 className="text-xs font-semibold text-[#1a1a19] uppercase tracking-wide">Corridor Status</h2>
            </div>
            <div className="space-y-2.5">
              {DEMO_CORRIDORS.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#1a1a19]">{c.name}</p>
                    <p className="text-[10px] text-[#8a8a87]">
                      {c.activeVehicles} vehicles · {c.incidents} incident{c.incidents !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <RiskBadge level={c.riskLevel} size="sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Fleet list */}
          <div className="flex-1 px-4 py-3 border-b border-[#e4e4e3]">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-3.5 h-3.5 text-[#8a8a87]" />
              <h2 className="text-xs font-semibold text-[#1a1a19] uppercase tracking-wide">Fleet</h2>
            </div>
            <div className="space-y-2.5">
              {activeVehicles.map((v) => (
                <div
                  key={v.id}
                  className="flex items-start justify-between py-2 border-b border-[#f4f4f3] last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-medium text-[#1a1a19] truncate">{v.id}</span>
                      <RiskBadge level={v.riskLevel} size="sm" />
                      {v.affectedByDisruptionId && v.rerouteStatus !== 'active' && v.status !== 'emergency_pickup' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fca5a5]">
                          AFFECTED
                        </span>
                      )}
                      {v.rerouteStatus === 'active' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]">
                          REROUTED
                        </span>
                      )}
                      {v.status === 'emergency_pickup' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#fff7ed] text-[#c2410c] border border-[#fdba74]">
                          EMERGENCY PICKUP
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#5a5a57] truncate">{v.driverName} {v.cargoType ? `· ${v.cargoType}` : ''}</p>
                    <p className={cn('text-[10px] font-medium mt-0.5', statusColors[v.status])}>
                      {getVehicleStatusLabel(v.status)}
                      {v.etaMinutes && ` · ETA ${formatEta(v.etaMinutes)}`}
                    </p>
                    {v.destination && (
                      <p className="text-[10px] text-[#8a8a87]">→ {v.destination}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
{/* Response Timeline */}
<div className="px-4 py-3 border-b border-[#e4e4e3]">
  <div className="flex items-center gap-2 mb-3">
    <Activity className="w-3.5 h-3.5 text-[#8a8a87]" />
    <h2 className="text-xs font-semibold text-[#1a1a19] uppercase tracking-wide">
      Response Timeline
    </h2>
  </div>

  <div className="space-y-3">
    {activeIncidents.some((inc) => inc.syncStatus === 'verified') && (
      <div className="flex gap-2">
        <div className="mt-1 w-2 h-2 rounded-full bg-[#16a34a] shrink-0" />
        <div>
          <p className="text-xs font-medium text-[#1a1a19]">Verified disruption</p>
          <p className="text-[10px] text-[#8a8a87]">
            SDMA verification updated the shared road state.
          </p>
        </div>
      </div>
    )}

    {affectedVehicles.length > 0 && (
      <div className="flex gap-2">
        <div className="mt-1 w-2 h-2 rounded-full bg-[#dc2626] shrink-0" />
        <div>
          <p className="text-xs font-medium text-[#1a1a19]">
            {affectedVehicles.length} vehicle{affectedVehicles.length !== 1 ? 's' : ''} affected
          </p>
          <p className="text-[10px] text-[#8a8a87]">
            Active shipments flagged for intervention.
          </p>
        </div>
      </div>
    )}

    {reroutedVehicles.some((v) => v.rerouteStatus === 'active') && (
      <div className="flex gap-2">
        <div className="mt-1 w-2 h-2 rounded-full bg-[#2563eb] shrink-0" />
        <div>
          <p className="text-xs font-medium text-[#1a1a19]">Reactive reroute active</p>
          <p className="text-[10px] text-[#8a8a87]">
            Alternate routing issued from the vehicle's current position.
          </p>
        </div>
      </div>
    )}

    {pickupRequests.some((r) => r.status === 'requested') && (
      <div className="flex gap-2">
        <div className="mt-1 w-2 h-2 rounded-full bg-[#d97706] shrink-0" />
        <div>
          <p className="text-xs font-medium text-[#1a1a19]">Emergency pickup requested</p>
          <p className="text-[10px] text-[#8a8a87]">
            Awaiting contractor approval for supply continuity.
          </p>
        </div>
      </div>
    )}

    {pickupRequests.some((r) => r.status === 'dispatched') && (
      <div className="flex gap-2">
        <div className="mt-1 w-2 h-2 rounded-full bg-[#16a34a] shrink-0" />
        <div>
          <p className="text-xs font-medium text-[#1a1a19]">Emergency pickup dispatched</p>
          <p className="text-[10px] text-[#8a8a87]">
            Godown stock reserved and destination notified.
          </p>
        </div>
      </div>
    )}
  </div>
</div>

          {/* Recent incidents */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-[#8a8a87]" />
              <h2 className="text-xs font-semibold text-[#1a1a19] uppercase tracking-wide">Active Incidents</h2>
            </div>
            <div className="space-y-3">
              {activeIncidents.map((inc) => (
                <div key={inc.id} className="pb-3 border-b border-[#f4f4f3] last:border-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-[#1a1a19]">{inc.id}</span>
                    <StatusBadge syncStatus={inc.syncStatus} />
                  </div>
                  <p className="text-xs text-[#5a5a57]">{getIncidentTypeLabel(inc.type)} — {inc.severity.toUpperCase()}</p>
                  <p className="text-[10px] text-[#8a8a87] truncate mt-0.5">{inc.locationName}</p>
                  <p className="text-[10px] text-[#c4c4c2] mt-0.5">{formatTimeAgo(inc.reportedAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
