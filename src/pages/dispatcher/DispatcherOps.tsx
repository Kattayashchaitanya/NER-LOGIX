import { useState } from 'react';
import {
  useNetworkStore,
  getReactiveDisplayRoute,
  findNearestSuitableGodown,
} from '@/store/networkStore';
import { DEMO_ROUTES } from '@/data/demo';
import type { Route } from '@/types';
import { MapContainer } from '@/components/map/MapContainer';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { formatEta, getIncidentTypeLabel, cn } from '@/utils';
import {
  Truck,
  AlertTriangle,
  Activity,
  Navigation,
  Warehouse,
  ArrowRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export function DispatcherOps() {
  const activeVehicles = useNetworkStore((state) => state.activeVehicles);
  const activeIncidents = useNetworkStore((state) => state.activeIncidents);
  const disruptions = useNetworkStore((state) => state.disruptions);
  const godowns = useNetworkStore((state) => state.godowns);
  const pickupRequests = useNetworkStore((state) => state.pickupRequests);

  const rerouteVehicle = useNetworkStore((state) => state.rerouteVehicle);
  const requestEmergencyPickup = useNetworkStore((state) => state.requestEmergencyPickup);

  const [activeTab, setActiveTab] = useState<'interventions' | 'fleet' | 'hazards'>('interventions');
  const [fleetFilter, setFleetFilter] = useState<'all' | 'affected' | 'rerouted'>('all');

  // Filtered collections
  const activeDisruptions = disruptions.filter((d) => d.status === 'active');
  const affectedVehicles = activeVehicles.filter(
    (v) => Boolean(v.affectedByDisruptionId) && v.rerouteStatus !== 'active' && v.status !== 'emergency_pickup'
  );
  const reroutedVehicles = activeVehicles.filter((v) => v.rerouteStatus === 'active');
  const safeVehiclesCount = activeVehicles.filter((v) => !v.affectedByDisruptionId && v.rerouteStatus !== 'active').length;

  // Build reactive routes for map rendering
  const reactiveMapRoutes: Route[] = activeVehicles
    .filter((v) => v.rerouteStatus === 'active')
    .map((v) => getReactiveDisplayRoute(v))
    .filter((r): r is Route => Boolean(r));

  const filteredFleet = activeVehicles.filter((v) => {
    if (fleetFilter === 'affected') return Boolean(v.affectedByDisruptionId) || v.rerouteStatus === 'no_alternative';
    if (fleetFilter === 'rerouted') return v.rerouteStatus === 'active';
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-[#f8f8f7]">
      {/* Operations Center Header Strip */}
      <div className="px-5 py-3 bg-white border-b border-[#e5e5e4] shrink-0 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">
              Fleet Operations Desk
            </span>
            <div className="hidden sm:block h-3.5 w-px bg-[#e5e5e4]" />
            <span className="text-xs text-[#71717a] font-medium">North Eastern Transit Corridor Control</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Grid Live</span>
            </div>
            {affectedVehicles.length > 0 && (
              <div className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                {affectedVehicles.length} Disrupted
              </div>
            )}
          </div>
        </div>

        {/* Compact 3-Metric Operational Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <MetricCard
            label="Affected Shipments"
            value={affectedVehicles.length.toString().padStart(2, '0')}
            subtext={affectedVehicles.length > 0 ? 'Requires route intervention' : 'All shipments clear'}
            riskLevel={affectedVehicles.length > 0 ? 'high' : 'low'}
            icon={<AlertTriangle className="w-4 h-4 text-rose-600" />}
          />
          <MetricCard
            label="Corridor Disruptions"
            value={activeDisruptions.length.toString().padStart(2, '0')}
            subtext={activeDisruptions.length > 0 ? `${activeDisruptions.length} active corridor cut${activeDisruptions.length > 1 ? 's' : ''}` : 'All corridors operational'}
            riskLevel={activeDisruptions.length > 0 ? 'high' : 'low'}
            icon={<Activity className="w-4 h-4 text-orange-600" />}
          />
          <MetricCard
            label="Active Fleet Tracked"
            value={activeVehicles.length}
            subtext={`${safeVehiclesCount} on schedule · ${reroutedVehicles.length} rerouted`}
            icon={<Truck className="w-4 h-4 text-blue-600" />}
          />
        </div>
      </div>

      {/* Main Command Surface: Map (Prominent) + Right Tactical Console */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Prominent Regional Geospatial Map */}
        <div className="flex-1 h-80 lg:h-full relative border-b lg:border-b-0 lg:border-r border-[#e4e4e3]">
          <MapContainer
            center={[25.5, 93.0]}
            zoom={7}
            routes={[...Object.values(DEMO_ROUTES), ...reactiveMapRoutes]}
            selectedRouteId={reactiveMapRoutes[0]?.id}
            incidents={activeIncidents}
            vehicles={activeVehicles}
            godowns={godowns}
            userRole="dispatcher"
            onRerouteVehicle={rerouteVehicle}
            onRequestEmergencyPickup={requestEmergencyPickup}
          />
        </div>

        {/* Tactical Right Command Desk */}
        <div className="w-full lg:w-[420px] xl:w-[460px] border-l border-[#e4e4e7] bg-white overflow-y-auto shrink-0 flex flex-col">
          {/* Tab Navigation */}
          <div className="p-3 border-b border-[#e4e4e7] bg-[#fafafa] flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('interventions')}
              className={cn(
                'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                activeTab === 'interventions'
                  ? 'bg-white text-[#18181b] shadow-xs border border-[#e4e4e7] ring-1 ring-black/5'
                  : 'text-[#71717a] hover:text-[#18181b] hover:bg-white/60'
              )}
            >
              <span>Action Queue</span>
              {affectedVehicles.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white">
                  {affectedVehicles.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('fleet')}
              className={cn(
                'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                activeTab === 'fleet'
                  ? 'bg-white text-[#18181b] shadow-xs border border-[#e4e4e7] ring-1 ring-black/5'
                  : 'text-[#71717a] hover:text-[#18181b] hover:bg-white/60'
              )}
            >
              <span>Fleet ({activeVehicles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('hazards')}
              className={cn(
                'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                activeTab === 'hazards'
                  ? 'bg-white text-[#18181b] shadow-xs border border-[#e4e4e7] ring-1 ring-black/5'
                  : 'text-[#71717a] hover:text-[#18181b] hover:bg-white/60'
              )}
            >
              <span>Hazards ({activeIncidents.length})</span>
            </button>
          </div>

          {/* TAB 1: INTERVENTIONS */}
          {activeTab === 'interventions' && (
            <div className="p-5 space-y-4 flex-1">
              {affectedVehicles.length > 0 ? (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                      Pending Route Interventions ({affectedVehicles.length})
                    </p>
                    <span className="text-xs text-[#71717a] font-medium">Immediate decision needed</span>
                  </div>

                  {affectedVehicles.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 rounded-2xl bg-white border-2 border-rose-200 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#18181b]">{v.id}</span>
                            <span className="text-xs text-[#52525b] font-medium">({v.driverName})</span>
                          </div>
                          <p className="text-xs text-blue-700 font-bold mt-0.5">
                            📦 {v.cargoType || 'Medical Relief Consignment'}
                          </p>
                        </div>
                        <StatusBadge label="Disrupted" variant="danger" pulse />
                      </div>

                      <div className="text-xs text-[#52525b] flex items-center justify-between bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                        <span className="flex items-center gap-1.5 font-bold text-[#18181b]">
                          {v.origin} <ArrowRight className="w-3.5 h-3.5 text-[#71717a]" /> {v.destination}
                        </span>
                        {v.etaMinutes && <span className="font-bold text-blue-700">ETA {formatEta(v.etaMinutes)}</span>}
                      </div>

                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-relaxed font-medium">
                        <strong className="text-rose-950 font-bold">Corridor Hazard:</strong> {v.impactReason || 'Blocked corridor on NH-2 Mao Gate.'}
                      </div>

                      <div className="pt-1">
                        {(() => {
                          const pendingPickupReq = pickupRequests.find(
                            (r) => r.vehicleId === v.id && r.status === 'requested'
                          );

                          if (pendingPickupReq) {
                            return (
                              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-amber-700" /> Emergency Pickup Requested
                                  </span>
                                  <StatusBadge label="Awaiting Approval" variant="warning" pulse />
                                </div>
                                <p className="text-xs text-amber-950 font-medium">
                                  <strong>{pendingPickupReq.godownName}</strong> · {pendingPickupReq.cargoType}
                                </p>
                                <p className="text-[11px] text-amber-800">
                                  Awaiting supply contractor confirmation ({pendingPickupReq.quantity} units buffer reserve).
                                </p>
                              </div>
                            );
                          }

                          if (v.rerouteStatus === 'no_alternative') {
                            const match = findNearestSuitableGodown(v, godowns);
                            const targetGodown = v.recommendedGodownId
                              ? godowns.find((g) => g.id === v.recommendedGodownId)
                              : match?.godown;
                            const distanceKm = v.recommendedGodownDistanceKm ?? match?.distanceKm ?? 68;

                            return (
                              <div className="space-y-2.5">
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                                    <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                                    <span>Emergency Storage Diversion Needed</span>
                                  </div>
                                  <p className="text-rose-800 text-[11px] font-medium">
                                    No clear alternate highway corridor from current vehicle position.
                                  </p>
                                </div>

                                {targetGodown && (
                                  <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold uppercase tracking-wider text-orange-900">
                                        Recommended Shelter Godown
                                      </span>
                                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-orange-200 text-orange-800">
                                        {targetGodown.availableStock} units capacity
                                      </span>
                                    </div>
                                    <p className="font-bold text-[#18181b] text-xs">{targetGodown.name}</p>
                                    <div className="flex items-center justify-between text-xs text-orange-900 font-medium">
                                      <span>Distance: ~{distanceKm} km</span>
                                      <span>Compatibility: Certified</span>
                                    </div>
                                  </div>
                                )}

                                <Button
                                  size="md"
                                  variant="danger"
                                  className="w-full text-xs font-bold"
                                  onClick={() => requestEmergencyPickup(v.id)}
                                  iconLeft={<Warehouse className="w-4 h-4" />}
                                >
                                  Request Emergency Pickup & Transfer
                                </Button>
                              </div>
                            );
                          }

                          return (
                            <Button
                              size="md"
                              variant="primary"
                              className="w-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white min-h-[44px]"
                              onClick={() => rerouteVehicle(v.id)}
                              iconLeft={<Navigation className="w-4 h-4" />}
                            >
                              Dispatch One-Tap Alternate Reroute
                            </Button>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#fafafa] border border-[#e4e4e7] text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-[#18181b]">All Shipments Clear & Moving</p>
                  <p className="text-xs text-[#71717a] max-w-xs mx-auto font-medium">
                    No active trucks require route intervention. Mountain corridors are running normally.
                  </p>
                </div>
              )}

              {/* Active Reroutes Sub-section */}
              {reroutedVehicles.length > 0 && (
                <div className="pt-4 border-t border-[#e4e4e7] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#71717a] uppercase tracking-wider">
                      Active Detours ({reroutedVehicles.length})
                    </span>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      In Progress
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {reroutedVehicles.map((v) => (
                      <div key={v.id} className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#18181b] text-sm">{v.id} ({v.driverName})</span>
                          <StatusBadge label="Rerouted" variant="info" />
                        </div>
                        <p className="text-xs text-[#52525b] font-medium">
                          Diverted from <strong className="text-[#18181b]">{v.rerouteFromLabel}</strong> to {v.destination}
                        </p>
                        {v.etaMinutes && (
                          <p className="text-xs text-blue-800 font-bold">
                            Adjusted ETA: {formatEta(v.etaMinutes)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Godown Continuity Sub-section */}
              {pickupRequests.length > 0 && (
                <div className="pt-4 border-t border-[#e4e4e7] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#71717a] uppercase tracking-wider">
                      Emergency Godown Dispatches ({pickupRequests.length})
                    </span>
                    <span className="text-xs text-[#71717a] font-medium">Buffer Status</span>
                  </div>

                  {pickupRequests.map((req) => (
                    <div key={req.id} className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#18181b] text-sm">{req.vehicleId}</span>
                        <StatusBadge
                          label={
                            req.status === 'dispatched'
                              ? 'Secured / Allocated'
                              : req.status === 'declined'
                              ? 'Declined'
                              : 'Awaiting Contractor'
                          }
                          variant={
                            req.status === 'dispatched'
                              ? 'success'
                              : req.status === 'declined'
                              ? 'danger'
                              : 'warning'
                          }
                          pulse={req.status === 'requested'}
                        />
                      </div>
                      <p className="text-xs text-amber-950 font-medium">
                        {req.status === 'dispatched'
                          ? `Emergency storage secured at ${req.godownName} (${req.quantity} units). Stock reserved by ${req.contractorName || 'Contractor'}.`
                          : req.status === 'declined'
                          ? `Storage request declined at ${req.godownName}. Alternative corridor evaluation required.`
                          : `Emergency storage requested at ${req.godownName} (${req.quantity} units). Pending supply operator approval.`}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-amber-900 font-bold">
                        <span>Cargo: {req.cargoType}</span>
                        <span>Dest: {req.destination}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FLEET OVERVIEW */}
          {activeTab === 'fleet' && (
            <div className="p-5 space-y-3.5 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-[#f4f4f5] p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setFleetFilter('all')}
                    className={cn('px-3 py-1 rounded-lg cursor-pointer transition-all', fleetFilter === 'all' ? 'bg-white text-[#18181b] shadow-xs' : 'text-[#71717a]')}
                  >
                    All ({activeVehicles.length})
                  </button>
                  <button
                    onClick={() => setFleetFilter('affected')}
                    className={cn('px-3 py-1 rounded-lg cursor-pointer transition-all', fleetFilter === 'affected' ? 'bg-white text-rose-700 shadow-xs' : 'text-[#71717a]')}
                  >
                    Alerts
                  </button>
                  <button
                    onClick={() => setFleetFilter('rerouted')}
                    className={cn('px-3 py-1 rounded-lg cursor-pointer transition-all', fleetFilter === 'rerouted' ? 'bg-white text-blue-700 shadow-xs' : 'text-[#71717a]')}
                  >
                    Rerouted
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {filteredFleet.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-xl border border-[#e4e4e7] bg-white flex items-center justify-between text-xs hover:border-zinc-400 transition-colors shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#18181b] text-sm">{v.id}</span>
                        <span className="text-xs text-[#71717a]">· {v.driverName}</span>
                        {v.affectedByDisruptionId && v.rerouteStatus !== 'active' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            DISRUPTED
                          </span>
                        )}
                        {v.rerouteStatus === 'active' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            REROUTED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#52525b] truncate mt-1 font-medium">
                        {v.origin} → {v.destination} {v.cargoType ? `· ${v.cargoType}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <RiskBadge level={v.riskLevel} size="md" />
                      {v.etaMinutes && (
                        <p className="text-xs font-bold text-[#18181b] mt-1">{formatEta(v.etaMinutes)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CORRIDOR HAZARDS */}
          {activeTab === 'hazards' && (
            <div className="p-5 space-y-3.5 flex-1">
              <span className="text-xs font-bold text-[#71717a] uppercase tracking-wider">
                Active Corridor Hazards ({activeIncidents.length})
              </span>

              <div className="space-y-3">
                {activeIncidents.map((inc) => (
                  <div key={inc.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2 text-xs shadow-2xs">
                    <div className="flex items-start justify-between">
                      <p className="font-bold text-rose-900 text-sm">
                        {getIncidentTypeLabel(inc.type)} · {inc.locationName}
                      </p>
                      <StatusBadge
                        label={inc.syncStatus === 'verified' ? 'SDMA Verified' : 'Pending Verification'}
                        variant={inc.syncStatus === 'verified' ? 'success' : 'warning'}
                      />
                    </div>
                    <p className="text-xs text-[#52525b] font-medium leading-relaxed">{inc.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-[#71717a] pt-1 border-t border-rose-100 font-medium">
                      <span>Reported by {inc.reportedBy}</span>
                      <span className="font-bold text-rose-800">Impact: High</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
