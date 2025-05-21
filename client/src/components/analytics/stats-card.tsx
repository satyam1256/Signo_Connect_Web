import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  className?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  className,
  valuePrefix = '',
  valueSuffix = ''
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
            <h4 className="text-2xl font-bold">
              {valuePrefix}{value}{valueSuffix}
            </h4>
            
            {trend && (
              <div className="flex items-center mt-2">
                <span 
                  className={cn(
                    "text-xs font-medium",
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  )}
                >
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
                {trend.label && (
                  <span className="text-xs text-neutral-500 ml-1">
                    {trend.label}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}