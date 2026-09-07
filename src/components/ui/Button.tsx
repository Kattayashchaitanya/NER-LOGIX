import { cn } from '@/utils';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 border-transparent shadow-xs',
  secondary:
    'bg-[#f4f4f5] text-[#18181b] hover:bg-[#e4e4e7] active:bg-[#d4d4d8] border-[#e4e4e7]',
  ghost:
    'bg-transparent text-[#52525b] hover:bg-[#f4f4f5] active:bg-[#e4e4e7] border-transparent',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border-transparent shadow-xs',
  outline:
    'bg-white text-[#18181b] hover:bg-[#f4f4f5] active:bg-[#e4e4e7] border-[#e4e4e7] shadow-xs',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg min-h-[36px]',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-xl min-h-[44px]',
  lg: 'px-6 py-3.5 text-base gap-2.5 rounded-xl min-h-[50px] font-semibold',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      iconLeft,
      iconRight,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold border transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          iconLeft
        )}
        <span>{children}</span>
        {!loading && iconRight}
      </button>
    );
  },
);

Button.displayName = 'Button';
