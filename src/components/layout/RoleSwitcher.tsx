import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/utils';
import type { UserRole } from '@/types';
import { Truck, Activity, ShieldCheck } from 'lucide-react';

interface RoleSwitcherProps {
  className?: string;
}

const roles: { id: UserRole; label: string; sublabel: string; icon: React.ReactNode; to: string }[] = [
  {
    id: 'driver',
    label: 'Driver',
    sublabel: 'Field operator',
    icon: <Truck className="w-4 h-4" />,
    to: '/driver',
  },
  {
    id: 'dispatcher',
    label: 'Dispatcher',
    sublabel: 'Operations center',
    icon: <Activity className="w-4 h-4" />,
    to: '/dispatcher',
  },
  {
    id: 'sdma',
    label: 'Govt / SDMA',
    sublabel: 'Authority review',
    icon: <ShieldCheck className="w-4 h-4" />,
    to: '/sdma',
  },
];

const roleColors: Record<UserRole, { active: string; hover: string; text: string }> = {
  driver: { active: 'bg-[#eff6ff] border-[#2563eb]', hover: 'hover:bg-[#eff6ff]', text: 'text-[#1e40af]' },
  dispatcher: { active: 'bg-[#fff7ed] border-[#c2410c]', hover: 'hover:bg-[#fff7ed]', text: 'text-[#9a3412]' },
  sdma: { active: 'bg-[#f0fdf4] border-[#16a34a]', hover: 'hover:bg-[#f0fdf4]', text: 'text-[#166534]' },
};

export function RoleSwitcher({ className }: RoleSwitcherProps) {
  const { role, setRole } = useAppStore();
  const navigate = useNavigate();

  const handleRoleChange = (r: UserRole, to: string) => {
    setRole(r);
    navigate(to);
  };

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <p className="text-[10px] text-[#8a8a87] uppercase tracking-wide font-medium mb-1.5 px-1">
        Switch View
      </p>
      {roles.map((r) => {
        const isActive = role === r.id;
        const colors = roleColors[r.id];
        return (
          <motion.button
            key={r.id}
            onClick={() => handleRoleChange(r.id, r.to)}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors duration-150',
              isActive
                ? `${colors.active} border border-current`
                : `bg-white border-[#e4e4e3] ${colors.hover}`,
            )}
          >
            <span className={cn('shrink-0', isActive ? colors.text : 'text-[#8a8a87]')}>
              {r.icon}
            </span>
            <div>
              <p className={cn('text-sm font-medium', isActive ? colors.text : 'text-[#1a1a19]')}>
                {r.label}
              </p>
              <p className="text-[10px] text-[#8a8a87]">{r.sublabel}</p>
            </div>
            {isActive && (
              <motion.div
                layoutId="activeRoleDot"
                className={cn('w-1.5 h-1.5 rounded-full ml-auto', {
                  'bg-[#2563eb]': r.id === 'driver',
                  'bg-[#c2410c]': r.id === 'dispatcher',
                  'bg-[#16a34a]': r.id === 'sdma',
                })}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
