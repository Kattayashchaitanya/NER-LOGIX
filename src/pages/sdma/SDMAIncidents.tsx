import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEMO_INCIDENTS } from '@/data/demo';
import { useNetworkStore } from '@/store/networkStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Button } from '@/components/ui/Button';
import { Notification } from '@/components/ui/Notification';
import { formatDateTime, formatTimeAgo, getIncidentTypeLabel } from '@/utils';
import { cn } from '@/utils';
import {
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  FileCheck,
  Camera,
  ChevronRight,
} from 'lucide-react';

export function SDMAIncidents() {
  const incidents = useNetworkStore((state) => state.activeIncidents);
  const verifyIncident = useNetworkStore((state) => state.verifyIncident);
  const syncFromIndexedDB = useNetworkStore((state) => state.syncFromIndexedDB);

  const [selectedId, setSelectedId] = useState<string | null>(DEMO_INCIDENTS[0]?.id || null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    syncFromIndexedDB();
  }, [syncFromIndexedDB]);

  const selected = incidents.find((i) => i.id === selectedId) || incidents[0] || null;

  const pendingIncidents = incidents.filter(
    (i) => i.syncStatus === 'pending_verification' || i.syncStatus === 'synced',
  );
  const verifiedIncidents = incidents.filter((i) => i.syncStatus === 'verified' || i.syncStatus === 'rejected');

  const handleVerify = (id: string, approved: boolean) => {
    setVerifyingId(id);
    setTimeout(async () => {
      await verifyIncident(id, approved, 'Ranjit Sharma (SDMA-NE)');
      setNotification({
        type: approved ? 'success' : 'error',
        msg: approved
          ? `Incident ${id} verified — road status updated`
          : `Incident ${id} rejected`,
      });
      setVerifyingId(null);
      setTimeout(() => setNotification(null), 3000);
    }, 1200);
  };

  return (
    <div className="h-full flex min-h-0">
      {/* Incident list */}
      <div className="w-80 border-r border-[#e4e4e3] bg-[#fafaf9] flex flex-col shrink-0">
        <div className="px-4 py-3 bg-white border-b border-[#e4e4e3]">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#8a8a87]" />
            <h1 className="text-sm font-semibold text-[#1a1a19]">Verification Queue</h1>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full bg-[#fffbeb] border border-[#fde68a] text-[#d97706] text-[10px] font-semibold">
              {pendingIncidents.length} Pending
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] text-[10px] font-semibold">
              {verifiedIncidents.length} Resolved
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {/* Pending section */}
          {pendingIncidents.length > 0 && (
            <div>
              <p className="px-4 py-1.5 text-[10px] text-[#8a8a87] uppercase tracking-wide font-medium">
                Awaiting Review
              </p>
              {pendingIncidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => setSelectedId(inc.id)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-2.5 border-b border-[#f0f0ef] text-left transition-colors',
                    selected?.id === inc.id
                      ? 'bg-[#eff6ff] border-l-2 border-l-[#2563eb]'
                      : 'hover:bg-white',
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-[#fffbeb] flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-3 h-3 text-[#d97706]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1a1a19]">{inc.id}</span>
                      <ChevronRight className="w-3 h-3 text-[#c4c4c2]" />
                    </div>
                    <p className="text-[11px] text-[#5a5a57]">{getIncidentTypeLabel(inc.type)}</p>
                    <p className="text-[10px] text-[#8a8a87] truncate">{inc.locationName}</p>
                    <p className="text-[10px] text-[#c4c4c2]">{formatTimeAgo(inc.reportedAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Resolved section */}
          {verifiedIncidents.length > 0 && (
            <div>
              <p className="px-4 py-1.5 text-[10px] text-[#8a8a87] uppercase tracking-wide font-medium mt-2">
                Resolved
              </p>
              {verifiedIncidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => setSelectedId(inc.id)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-2.5 border-b border-[#f0f0ef] text-left transition-colors',
                    selected?.id === inc.id
                      ? 'bg-[#eff6ff] border-l-2 border-l-[#2563eb]'
                      : 'hover:bg-white',
                  )}
                >
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                    inc.syncStatus === 'verified' ? 'bg-[#f0fdf4]' : 'bg-[#fef2f2]'
                  )}>
                    {inc.syncStatus === 'verified'
                      ? <CheckCircle className="w-3 h-3 text-[#16a34a]" />
                      : <XCircle className="w-3 h-3 text-[#dc2626]" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-[#1a1a19]">{inc.id}</span>
                    <p className="text-[11px] text-[#5a5a57]">{getIncidentTypeLabel(inc.type)}</p>
                    <StatusBadge syncStatus={inc.syncStatus} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto bg-white">
        {notification && (
          <div className="px-6 pt-4">
            <Notification
              type={notification.type}
              title={notification.msg}
              visible
            />
          </div>
        )}

        {selected ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="px-6 py-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold text-[#1a1a19]">{selected.id}</h2>
                    <StatusBadge syncStatus={selected.syncStatus} />
                  </div>
                  <p className="text-sm text-[#5a5a57]">
                    {getIncidentTypeLabel(selected.type)} — Severity: {selected.severity.toUpperCase()}
                  </p>
                </div>
                <RiskBadge
                  level={
                    selected.severity === 'critical' ? 'blocked' :
                    selected.severity === 'high' ? 'high' :
                    selected.severity === 'moderate' ? 'moderate' : 'low'
                  }
                />
              </div>

              {/* Photo placeholder */}
              <div className="mb-5 bg-[#f8f8f7] border border-[#e4e4e3] rounded-lg h-48 flex flex-col items-center justify-center">
                <Camera className="w-8 h-8 text-[#c4c4c2] mb-2" />
                <p className="text-sm text-[#8a8a87]">Field photo evidence</p>
                <p className="text-xs text-[#c4c4c2]">Photo attached by field officer</p>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-[#f8f8f7] rounded p-3 border border-[#e4e4e3]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-[#8a8a87]" />
                    <span className="text-[10px] text-[#8a8a87] uppercase tracking-wide">Location</span>
                  </div>
                  <p className="text-xs font-medium text-[#1a1a19]">{selected.locationName}</p>
                  <p className="text-[10px] text-[#8a8a87] mt-0.5">
                    {selected.location[0].toFixed(4)}°N, {selected.location[1].toFixed(4)}°E
                  </p>
                </div>
                <div className="bg-[#f8f8f7] rounded p-3 border border-[#e4e4e3]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#8a8a87]" />
                    <span className="text-[10px] text-[#8a8a87] uppercase tracking-wide">Reported</span>
                  </div>
                  <p className="text-xs font-medium text-[#1a1a19]">{formatDateTime(selected.reportedAt)}</p>
                  <p className="text-[10px] text-[#8a8a87] mt-0.5">{formatTimeAgo(selected.reportedAt)}</p>
                </div>
                <div className="bg-[#f8f8f7] rounded p-3 border border-[#e4e4e3] col-span-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-[#8a8a87]" />
                    <span className="text-[10px] text-[#8a8a87] uppercase tracking-wide">Reported By</span>
                  </div>
                  <p className="text-xs font-medium text-[#1a1a19]">{selected.reportedBy}</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-5">
                <p className="text-[10px] text-[#8a8a87] uppercase tracking-wide mb-2">Field Report</p>
                <div className="bg-[#f8f8f7] border border-[#e4e4e3] rounded p-3">
                  <p className="text-sm text-[#1a1a19] leading-relaxed">{selected.description}</p>
                </div>
              </div>

              {/* Verification if already done */}
              {selected.verifiedBy && (
                <div className="mb-5 p-3 rounded bg-[#f0fdf4] border border-[#bbf7d0]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle className="w-3.5 h-3.5 text-[#16a34a]" />
                    <span className="text-xs font-medium text-[#166534]">Verified</span>
                  </div>
                  <p className="text-xs text-[#16a34a]">
                    By {selected.verifiedBy} · {selected.verifiedAt ? formatTimeAgo(selected.verifiedAt) : ''}
                  </p>
                </div>
              )}

              {/* Actions */}
              {(selected.syncStatus === 'pending_verification' || selected.syncStatus === 'synced') && (
                <div className="border-t border-[#e4e4e3] pt-4">
                  <p className="text-xs text-[#8a8a87] mb-3">
                    Verifying this incident will update road status and notify affected dispatchers and drivers.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      iconLeft={<CheckCircle className="w-3.5 h-3.5" />}
                      loading={verifyingId === selected.id}
                      onClick={() => handleVerify(selected.id, true)}
                    >
                      Verify & Update Road Status
                    </Button>
                    <Button
                      variant="ghost"
                      iconLeft={<XCircle className="w-3.5 h-3.5" />}
                      onClick={() => handleVerify(selected.id, false)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-[#8a8a87]">Select an incident to review</p>
          </div>
        )}
      </div>
    </div>
  );
}
