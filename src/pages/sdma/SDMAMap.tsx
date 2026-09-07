import { MapContainer } from '@/components/map/MapContainer';
import { DEMO_INCIDENTS } from '@/data/demo';
import { ShieldCheck } from 'lucide-react';

export function SDMAMap() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-3 bg-white border-b border-[#e4e4e3] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
        <h1 className="text-sm font-semibold text-[#1a1a19]">Accessibility Map</h1>
      </div>
      <div className="flex-1 min-h-0">
        <MapContainer
          center={[25.5, 93.0]}
          zoom={7}
          incidents={DEMO_INCIDENTS}
          vehicles={[]}
        />
      </div>
    </div>
  );
}
