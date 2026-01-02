/**
 * Maps Container
 * 
 * UI container that subscribes to Google Maps function events
 * and displays location data.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, ExternalLink, Loader2 } from 'lucide-react';
import { chatEventBus } from '@/lib/chatFunctions/eventBus';
import type { LocationResult, MapsEventPayloads } from '@/lib/chatFunctions/googleMaps';

interface MapsContainerProps {
  requestId?: string;
}

export function MapsContainer({ requestId }: MapsContainerProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [nearby, setNearby] = useState<LocationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to maps events
    const handleSearching = (payload: MapsEventPayloads['maps:searching']) => {
      if (requestId && payload.requestId !== requestId) return;
      setIsSearching(true);
      setError(null);
    };

    const handleResult = (payload: MapsEventPayloads['maps:result']) => {
      if (requestId && payload.requestId !== requestId) return;
      setIsSearching(false);
      setLocation(payload.location);
      setNearby(payload.nearby || []);
    };

    const handleError = (payload: MapsEventPayloads['maps:error']) => {
      if (requestId && payload.requestId !== requestId) return;
      setIsSearching(false);
      setError(payload.error);
    };

    // Subscribe using any cast since these are custom events
    const bus = chatEventBus as any;
    const unsub1 = bus.subscribe('maps:searching', handleSearching, requestId);
    const unsub2 = bus.subscribe('maps:result', handleResult, requestId);
    const unsub3 = bus.subscribe('maps:error', handleError, requestId);

    return () => {
      unsub1?.();
      unsub2?.();
      unsub3?.();
    };
  }, [requestId]);

  if (!isSearching && !location && !error) {
    return null; // Don't render until there's something to show
  }

  if (isSearching) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
          <span className="text-muted-foreground">Searching location...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md border-destructive/50">
        <CardContent className="py-4">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!location) {
    return null;
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${location.latitude},${location.longitude}`
  )}`;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          {location.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Info */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{location.address}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Navigation className="h-3 w-3" />
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </div>
          {location.types && location.types.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {location.types.map(type => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Static Map Preview */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Map Preview</p>
              <p className="text-xs text-muted-foreground">(requires Google Maps API key)</p>
            </div>
          </div>
        </div>

        {/* Nearby Places */}
        {nearby.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Nearby Places</h4>
            <div className="space-y-1">
              {nearby.map((place, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>{place.name}</span>
                  {place.types && (
                    <Badge variant="outline" className="text-xs ml-auto">
                      {place.types[0]?.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Open in Maps
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
