import { useNavigate } from 'react-router-dom';
import { useNetworkStore } from '@/store/networkStore';
import type { RoadStatus } from '@/types';
import { MapContainer } from '@/components/map/MapContainer';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatTimeAgo, getIncidentTypeLabel } from '@/utils';
import {
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Map,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const roadStatusConfig: Record<RoadStatus, { label: string; color: string; bg: string; border: string }> = {
  open: { label: 'Open', color: 'text-[#16a34a]', bg: 'bg-[#f0fdf4]', border: 'border-[#bbf7d0]' },
  caution: { label: 'Caution', color: 'text-[#d97706]', bg: 'bg-[#fffbeb]', border: 'border-[#fde68a]' },
  high_risk: { label: 'High Risk', color: 'text-[#ea580c]', bg: 'bg-[#fff7ed]', border: 'border-[#fed7aa]' },
  blocked: { label: 'Blocked', color: 'text-[#dc2626]', bg: 'bg-[#fef2f2]', border: 'border-[#fecaca]' },
};

export function SDMADashboard() {
  const activeIncidents = useNetworkStore((state) => state.activeIncidents);
  const roadSegments = useNetworkStore((state) => state.roadSegments);
  const activeVehicles = useNetworkStore((state) => state.activeVehicles);
  const verifyIncident = useNetworkStore((state) => state.verifyIncident);

  const navigate = useNavigate();

  const pendingIncidents = activeIncidents.filter((i) => i.syncStatus === 'pending_verification' || i.syncStatus === 'synced');
  const verifiedIncidents = activeIncidents.filter((i) => i.syncStatus === 'verified');
  const blockedRoads = roadSegments.filter((r) => r.status === 'blocked');
  const cautionRoads = roadSegments.filter((r) => r.status === 'caution');

  return (
    <div className="h-full flex flex-col bg-[#f8f8f7]">
      {/* SDMA Authority Header */}
      <div className="px-5 py-3 bg-white border-b border-[#e5e5e4] shrink-0 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              SDMA Authority Desk
            </span>
            <div className="hidden sm:block h-3.5 w-px bg-[#e5e5e4]" />
            <span className="text-xs text-[#71717a] font-medium">Regional Accessibility & Hazard Intelligence</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/sdma/incidents')}
              iconLeft={<FileCheck className="w-3.5 h-3.5" />}
              className="cursor-pointer"
            >
              Review Queue ({pendingIncidents.length})
            </Button>
          </div>
        </div>

        {/* Focused 3-Metric Authority Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <MetricCard
            label="Pending Field Reports"
            value={pendingIncidents.length.toString().padStart(2, '0')}
            subtext={pendingIncidents.length > 0 ? 'Awaiting authority triage' : 'Queue fully cleared'}
            riskLevel={pendingIncidents.length > 0 ? 'moderate' : 'low'}
            icon={<FileCheck className="w-4 h-4 text-amber-600" />}
          />
          <MetricCard
            label="Verified Active Hazards"
            value={verifiedIncidents.length.toString().padStart(2, '0')}
            subtext={verifiedIncidents.length > 0 ? 'Enforced across regional routing grid' : 'No active hazards'}
            riskLevel={verifiedIncidents.length > 0 ? 'high' : 'low'}
            icon={<AlertTriangle className="w-4 h-4 text-rose-600" />}
          />
          <MetricCard
            label="Corridors Blocked / Caution"
            value={`${blockedRoads.length} / ${cautionRoads.length}`}
            subtext={blockedRoads.length > 0 ? `${blockedRoads[0]?.name || 'Corridor'} blocked` : 'All corridors open'}
            riskLevel={blockedRoads.length > 0 ? 'high' : 'low'}
            icon={<Map className="w-4 h-4 text-[#71717a]" />}
          />
        </div>
      </div>

      {/* Main Map + Right Intelligence Panel */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Prominent Regional Hazard & Road Map */}
        <div className="flex-1 h-80 lg:h-full relative border-b lg:border-b-0 lg:border-r border-[#e4e4e3]">
          <MapContainer
            center={[25.5, 93.0]}
            zoom={7}
            incidents={activeIncidents}
            roadSegments={roadSegments}
            vehicles={activeVehicles}
            userRole="sdma"
            onVerifyIncident={verifyIncident}
          />
        </div>

        {/* Right Intelligence & Triage Panel */}
        <div className="w-full lg:w-[420px] xl:w-[460px] bg-white overflow-y-auto shrink-0 flex flex-col divide-y divide-[#e4e4e7] border-l border-[#e4e4e7]">
          {/* Priority Incident Verification Triage */}
          <div className="p-5 bg-[#fafafa]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-600" />
                <h2 className="text-xs font-bold text-[#18181b] uppercase tracking-wider">
                  Verification Triage Queue
                </h2>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300">
                {pendingIncidents.length} Pending
              </span>
            </div>

            <div className="space-y-3.5 mt-2">
              {pendingIncidents.length > 0 ? (
                pendingIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-4 rounded-2xl bg-white border-2 border-amber-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#18181b]">{inc.id}</span>
                        <p className="text-sm font-bold text-amber-900 mt-0.5">
                          {getIncidentTypeLabel(inc.type)} · {inc.severity.toUpperCase()}
                        </p>
                      </div>
                      <StatusBadge syncStatus={inc.syncStatus} />
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5 text-amber-950 font-medium">
                      <p className="font-bold flex items-center gap-1.5">
                        <span>📍 {inc.locationName}</span>
                      </p>
                      <p className="text-xs opacity-95 leading-relaxed">{inc.description}</p>
                    </div>

                    <div className="text-xs text-[#71717a] flex items-center justify-between font-medium">
                      <span>Reporter: {inc.reportedBy}</span>
                      <span>{formatTimeAgo(inc.reportedAt)}</span>
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <Button
                        size="md"
                        variant="primary"
                        className="flex-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]"
                        onClick={() => verifyIncident(inc.id, true, 'Ranjit Sharma (SDMA-NE)')}
                        iconLeft={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Verify & Enforce
                      </Button>
                      <Button
                        size="md"
                        variant="outline"
                        className="text-xs font-bold border-zinc-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 min-h-[44px] px-3.5"
                        onClick={() => verifyIncident(inc.id, false, 'SDMA Operations Desk')}
                        iconLeft={<XCircle className="w-4 h-4" />}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-2xl bg-white border border-[#e4e4e7] text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-[#18181b]">Queue Cleared</p>
                  <p className="text-xs text-[#71717a] font-medium">No pending incident reports awaiting authority triage.</p>
                </div>
              )}
            </div>
          </div>

          {/* Highway Corridors Status */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#71717a] uppercase tracking-wider">
                Corridor Accessibility Registry
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs font-bold text-blue-700 p-0 h-auto hover:bg-transparent hover:underline"
                onClick={() => navigate('/sdma/roads')}
              >
                All Segments →
              </Button>
            </div>

            <div className="space-y-2">
              {roadSegments.slice(0, 4).map((seg) => {
                const cfg = roadStatusConfig[seg.status] || roadStatusConfig.open;
                return (
                  <div
                    key={seg.id}
                    className="p-3 rounded-xl border border-[#e4e4e7] bg-white flex items-center justify-between text-xs hover:border-zinc-400 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-bold text-[#18181b] truncate text-xs">{seg.name}</p>
                      <p className="text-[11px] text-[#71717a] font-medium mt-0.5">{seg.fromLocation} → {seg.toLocation}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${cfg.color} ${cfg.bg} border ${cfg.border} shrink-0`}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification Protocol Lifecycle Note */}
          <div className="p-5 bg-[#fafafa] space-y-2 mt-auto">
            <span className="text-xs font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Authority Clearance Protocol
            </span>
            <p className="text-xs text-[#52525b] leading-relaxed font-medium">
              Verified road closures immediately broadcast to dispatcher control desks and trigger automatic recalculations for active fleet convoys.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
