// KPI Status Badge Component

import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPIStatusBadgeProps {
  status: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  exceeded: {
    label: 'עולה על היעד',
    variant: 'default' as const,
    className: 'bg-green-500 hover:bg-green-600',
    icon: TrendingUp,
  },
  on_track: {
    label: 'בדרך ליעד',
    variant: 'default' as const,
    className: 'bg-blue-500 hover:bg-blue-600',
    icon: Target,
  },
  at_risk: {
    label: 'בסיכון',
    variant: 'default' as const,
    className: 'bg-yellow-500 hover:bg-yellow-600 text-black',
    icon: AlertTriangle,
  },
  behind: {
    label: 'מאחור',
    variant: 'destructive' as const,
    className: '',
    icon: TrendingDown,
  },
};

export function KPIStatusBadge({ status, showIcon = true, size = 'md' }: KPIStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.behind;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  return (
    <Badge 
      variant={config.variant} 
      className={cn(config.className, sizeClasses[size], 'gap-1')}
    >
      {showIcon && <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />}
      {config.label}
    </Badge>
  );
}
