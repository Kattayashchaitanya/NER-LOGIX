import { useEffect } from 'react';
import { MapContainer } from '@/components/map/MapContainer';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useNetworkStore } from '@/store/networkStore';
import { Warehouse, Package, Truck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ContractorOps() {
  const godowns = useNetworkStore((state) => state.godowns);
  const activeVehicles = useNetworkStore((state) => state.activeVehicles);
  const pickupRequests = useNetworkStore((state) => state.pickupRequests);
  const approveEmergencyPickup = useNetworkStore((state) => state.approveEmergencyPickup);
  const declineEmergencyPickup = useNetworkStore((state) => state.declineEmergencyPickup);
  const syncFromIndexedDB = useNetworkStore((state) => state.syncFromIndexedDB);

  useEffect(() => {
    syncFromIndexedDB();
  }, [syncFromIndexedDB]);

  const pendingPickups = pickupRequests.filter((r) => r.status === 'requested');
  const securedPickups = pickupRequests.filter((r) => r.status === 'dispatched');
  const totalStock = godowns.reduce((acc, g) => acc + g.availableStock, 0);

  // Vehicles to display on map: those with pending pickup requests or active emergency pickup status
  const relevantVehicles = activeVehicles.filter(
    (v) => pendingPickups.some((r) => r.vehicleId === v.id) || v.status === 'emergency_pickup'
  );

  return (
    <div className="h-full flex flex-col bg-[#f8f8f7]">
      {/* Contractor Header */}
      <div className="px-6 py-3.5 bg-white border-b border-[#e4e4e3] shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#fdf4ff] text-[#86198f] border border-[#f5d0fe]">
                Supply & Logistics Contractor
              </span>
              <span className="text-xs text-[#8a8a87]">· Regional Emergency Buffer Network</span>
            </div>
            <h1 className="text-lg font-bold text-[#1a1a19] tracking-tight mt-0.5">
              Emergency Supply Operations
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <StatusBadge label="Buffer Storage Active" variant="success" />
            <span className="text-xs text-[#8a8a87] hidden md:inline">
              {godowns.length} Regional Godown Nodes
            </span>
          </div>
        </div>

        {/* Operational Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricCard
            label="Pending Pickup Requests"
            value={pendingPickups.length.toString().padStart(2, '0')}
            subtext={pendingPickups.length > 0 ? 'Urgent relief consignment buffer required' : 'No pending buffer requests'}
            riskLevel={pendingPickups.length > 0 ? 'high' : 'low'}
            icon={<AlertTriangle className="w-4 h-4 text-[#dc2626]" />}
          />
          <MetricCard
            label="Active Storage Nodes"
            value={godowns.length}
            subtext="Guwahati · Dimapur · Haflong · Mao"
            icon={<Warehouse className="w-4 h-4 text-[#86198f]" />}
          />
          <MetricCard
            label="Total Buffer Stock Units"
            value={`${totalStock} Units`}
            subtext="Across 4 regional buffer godowns"
            riskLevel="low"
            icon={<Package className="w-4 h-4 text-[#16a34a]" />}
          />
        </div>
      </div>

      {/* Main Workspace Split */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Godown Network Map */}
        <div className="flex-1 h-80 lg:h-full relative border-b lg:border-b-0 lg:border-r border-[#e4e4e3]">
          <MapContainer
            center={[25.7, 93.3]}
            zoom={7}
            godowns={godowns}
            vehicles={relevantVehicles}
            userRole="contractor"
          />
        </div>

        {/* Right Operations Panel */}
        <div className="w-full lg:w-[420px] xl:w-[460px] border-l border-[#e4e4e7] bg-white overflow-y-auto shrink-0 flex flex-col divide-y divide-[#e4e4e7]">
          {/* Emergency Pickup Queue */}
          <div className="p-5 bg-[#fafafa]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-700" />
                <h2 className="text-xs font-bold text-[#18181b] uppercase tracking-wider">
                  Emergency Pickup Queue
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
                {pendingPickups.length} Pending
              </span>
            </div>

            {pendingPickups.length > 0 ? (
              <div className="space-y-3.5">
                {pendingPickups.map((req) => {
                  const targetGodown = godowns.find((g) => g.id === req.godownId);
                  const vehicle = activeVehicles.find((v) => v.id === req.vehicleId);
                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl bg-white border-2 border-purple-200 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#18181b]">{req.vehicleId}</span>
                            <span className="text-xs text-[#52525b] font-medium">({req.driverName})</span>
                          </div>
                          <p className="text-xs text-purple-800 font-bold mt-0.5">
                            Cargo: {req.cargoType}
                          </p>
                        </div>
                        <StatusBadge label="Pickup Requested" variant="warning" pulse />
                      </div>

                      <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-xs space-y-2 text-purple-950 font-medium">
                        <div className="flex items-center justify-between">
                          <span className="text-[#71717a]">Transit Route:</span>
                          <span className="font-bold text-[#18181b]">
                            {vehicle?.origin || 'Guwahati'} → {req.destination}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#71717a]">Designated Godown:</span>
                          <span className="font-bold text-[#18181b]">{req.godownName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#71717a]">Available Buffer Stock:</span>
                          <span className="font-bold text-emerald-700">{targetGodown?.availableStock ?? 120} units</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-purple-200 pt-1.5">
                          <span className="font-bold text-purple-950">Requested Buffer Allocation:</span>
                          <span className="font-extrabold text-purple-900 text-sm">{req.quantity} units</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 pt-1">
                        <Button
                          size="md"
                          variant="primary"
                          className="flex-1 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer shadow-xs min-h-[44px]"
                          onClick={() => approveEmergencyPickup(req.id)}
                          iconLeft={<CheckCircle2 className="w-4 h-4" />}
                        >
                          Approve Emergency Storage
                        </Button>
                        <Button
                          size="md"
                          variant="outline"
                          className="text-xs font-bold border-zinc-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 cursor-pointer min-h-[44px] px-4"
                          onClick={() => declineEmergencyPickup(req.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-white border border-[#e4e4e7] text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-[#18181b]">No Pending Emergency Pickups</p>
                <p className="text-xs text-[#71717a] font-medium">
                  All regional godowns operating at normal buffer capacity.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs font-bold text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100 mt-2"
                  onClick={() => {
                    useNetworkStore.getState().requestEmergencyPickup('NL-02-C-3391');
                  }}
                >
                  Simulate NL-02-C-3391 Godown Fallback
                </Button>
              </div>
            )}
          </div>

          {/* Active Secured Allocations */}
          {securedPickups.length > 0 && (
            <div className="p-5 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#71717a] uppercase tracking-wider">
                  Active Buffer Allocations ({securedPickups.length})
                </span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Stock Reserved
                </span>
              </div>

              {securedPickups.map((req) => (
                <div key={req.id} className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 text-sm">{req.vehicleId} · {req.driverName}</span>
                    <StatusBadge label="Allocated / Secured" variant="success" />
                  </div>
                  <p className="text-xs text-emerald-900 font-medium">
                    <strong>{req.godownName}</strong>: {req.quantity} units buffer stock reserved.
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-emerald-800 font-medium">
                    <span>Cargo: {req.cargoType}</span>
                    <span>Dest: {req.destination}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Regional Godown Registry */}
          <div className="p-5 space-y-3">
            <h2 className="text-xs font-bold text-[#71717a] uppercase tracking-wider">
              Regional Buffer Nodes ({godowns.length})
            </h2>

            <div className="space-y-2.5">
              {godowns.map((g) => (
                <div key={g.id} className="p-3.5 rounded-xl bg-zinc-50 border border-[#e4e4e7] space-y-1.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#18181b]">{g.name}</p>
                      <p className="text-xs text-[#71717a] font-medium">{g.locationLabel}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-[#e4e4e7] text-[#18181b]">
                      {g.availableStock} units
                    </span>
                  </div>

                  <div className="text-xs text-[#52525b] pt-1 border-t border-zinc-200 font-medium">
                    <span className="text-[#71717a]">Suitable Cargo: </span>
                    <span className="font-bold text-[#18181b]">{g.suitableCargoTypes.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Policy Note */}
          <div className="p-5 bg-[#fafafa] text-xs text-[#71717a] flex items-start gap-3 mt-auto">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-xs text-[#52525b] font-medium">
              <strong className="text-[#18181b]">Emergency Godown Shelter Protocol:</strong> When severe mountain blockages close all transit corridors (&gt;85/100 risk score), freight is diverted to the closest verified regional godown to protect perishable medicines, rations, and driver safety.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
