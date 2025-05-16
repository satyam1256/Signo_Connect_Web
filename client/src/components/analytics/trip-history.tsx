import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Trip } from '@/types/trip';
import { MapPin, Calendar, Truck, Star } from 'lucide-react';

interface TripHistoryProps {
    trips: Trip[];
    title?: string;
}

export function TripHistory({ trips, title = "Recent Trips" }: TripHistoryProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Route</TableHead>
                                <TableHead>Distance</TableHead>
                                <TableHead>Vehicle</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Rating</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trips.map((trip) => (
                                <TableRow key={trip.naming_series}>
                                    <TableCell className="py-3">
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 text-neutral-500 mr-2" />
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {trip.started_on ? new Date(trip.started_on).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    }) : 'N/A'}
                                                </p>
                                                <p className="text-xs text-neutral-500">
                                                    {trip.ended_on ? new Date(trip.ended_on).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    }) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center">
                                            <MapPin className="h-4 w-4 text-neutral-500 mr-2" />
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {trip.origin}
                                                </p>
                                                <p className="text-xs text-neutral-500">
                                                    {trip.destination}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <span className="text-sm font-medium">
                                            {trip.odo_start && trip.odo_end
                                                ? `${Number(trip.odo_end) - Number(trip.odo_start)} km`
                                                : 'N/A'}
                                        </span>
                                        <br />
                                        <span className="text-xs text-neutral-500">
                                            {trip.started_on && trip.ended_on
                                                ? `${Math.round((new Date(trip.ended_on).getTime() - new Date(trip.started_on).getTime()) / (1000 * 60 * 60))} hrs`
                                                : 'N/A'}
                                        </span>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center">
                                            <Truck className="h-4 w-4 text-neutral-500 mr-2" />
                                            <span className="text-sm">{trip.vehicle_type || 'N/A'}</span>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <Badge
                                            className={
                                                trip.status === 'completed'
                                                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                    : trip.status === 'in-progress'
                                                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                                            }
                                        >
                                            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}