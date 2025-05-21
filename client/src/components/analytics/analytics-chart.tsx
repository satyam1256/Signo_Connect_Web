import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsChartProps {
  title: string;
  description?: string;
  data: any[];
  type: 'bar' | 'line' | 'area';
  xAxisKey: string;
  yAxisKey: string;
  color?: string;
  height?: number;
  secondaryYAxisKey?: string;
  secondaryColor?: string;
}

export function AnalyticsChart({
  title,
  description,
  data,
  type,
  xAxisKey,
  yAxisKey,
  color = "#FF6D00",
  secondaryYAxisKey,
  secondaryColor = "#4338CA",
  height = 300
}: AnalyticsChartProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="pt-0">
        <div style={{ width: '100%', height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            {type === 'bar' ? (
              <BarChart
                data={data}
                margin={{
                  top: 5,
                  right: 5,
                  left: 5,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey={xAxisKey} 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#E0E0E0' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '4px', 
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    border: 'none'
                  }}
                />
                <Bar dataKey={yAxisKey} fill={color} radius={[4, 4, 0, 0]} barSize={30} />
                {secondaryYAxisKey && (
                  <Bar dataKey={secondaryYAxisKey} fill={secondaryColor} radius={[4, 4, 0, 0]} barSize={30} />
                )}
                {secondaryYAxisKey && <Legend />}
              </BarChart>
            ) : type === 'line' ? (
              <LineChart
                data={data}
                margin={{
                  top: 5,
                  right: 5,
                  left: 5,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey={xAxisKey} 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#E0E0E0' }}
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}`} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '4px', 
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    border: 'none'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey={yAxisKey} 
                  stroke={color} 
                  strokeWidth={2}
                  dot={{ fill: color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: color }}
                />
                {secondaryYAxisKey && (
                  <Line 
                    type="monotone" 
                    dataKey={secondaryYAxisKey} 
                    stroke={secondaryColor} 
                    strokeWidth={2}
                    dot={{ fill: secondaryColor, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: secondaryColor }}
                  />
                )}
                {secondaryYAxisKey && <Legend />}
              </LineChart>
            ) : (
              <AreaChart
                data={data}
                margin={{
                  top: 5,
                  right: 5,
                  left: 5,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey={xAxisKey} 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#E0E0E0' }}
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}`} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '4px', 
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    border: 'none'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey={yAxisKey} 
                  stroke={color} 
                  fill={color}
                  fillOpacity={0.2}
                  activeDot={{ r: 6, fill: color }}
                />
                {secondaryYAxisKey && (
                  <Area 
                    type="monotone" 
                    dataKey={secondaryYAxisKey} 
                    stroke={secondaryColor} 
                    fill={secondaryColor}
                    fillOpacity={0.2}
                    activeDot={{ r: 6, fill: secondaryColor }}
                  />
                )}
                {secondaryYAxisKey && <Legend />}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}