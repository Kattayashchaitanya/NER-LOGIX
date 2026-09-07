import { cn } from '@/utils';
import type { RiskLevel } from '@/types';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  riskLevel?: RiskLevel;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ label, value, subtext, riskLevel, icon, className }: MetricCardProps) {
  const valueColor = riskLevel
    ? {
        low: 'text-emerald-600',
        moderate: 'text-amber-600',
        high: 'text-rose-600',
        blocked: 'text-rose-900',
      }[riskLevel]
    : 'text-[#18181b]';

  return (
    <div
      className={cn(
        'bg-white border border-[#e4e4e7] rounded-xl px-4 py-3.5',
        'shadow-xs hover:border-[#d4d4d8] transition-all',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-[#71717a] font-semibold uppercase tracking-wider leading-none mb-2">
            {label}
          </p>
          <p className={cn('text-2xl font-bold leading-tight tabular-nums', valueColor)}>
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-[#52525b] mt-1.5 leading-snug font-medium">{subtext}</p>
          )}
        </div>
        {icon && (
          <div className="text-[#71717a] shrink-0 mt-0.5 p-2 rounded-lg bg-[#f4f4f5]">{icon}</div>
        )}
      </div>
    </div>
  );
}
