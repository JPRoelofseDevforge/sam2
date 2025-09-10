import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';
import { GpsPoint } from '../types/specializedData';
import { AuthComponent } from './AuthComponent';
import L from 'leaflet';
import { useRef } from 'react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const GpsMapComponent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [gpsPoints, setGpsPoints] = useState<GpsPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDistance, setTotalDistance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  if (!isAuthenticated) {
    return <AuthComponent />;
  }

  const fetchAllGpsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let allPoints: GpsPoint[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const data = await dataService.getGpsData(undefined, page, 50);
        if (data.length === 0) {
          hasMore = false;
        } else {
          allPoints = [...allPoints, ...data];
          page++;
        }
      }
      setGpsPoints(allPoints);
      calculateDistance(allPoints);
    } catch (error: any) {
      if (error.response?.status === 401 || error.name === 'AuthError') {
        try {
          await authService.refreshToken();
          // Retry
          let allPoints: GpsPoint[] = [];
          let page = 1;
          let hasMore = true;
          while (hasMore) {
            const data = await dataService.getGpsData(undefined, page, 50);
            if (data.length === 0) {
              hasMore = false;
            } else {
              allPoints = [...allPoints, ...data];
              page++;
            }
          }
          setGpsPoints(allPoints);
          calculateDistance(allPoints);
        } catch (refreshError) {
          toast.error('Authentication expired. Please log in again.');
          setError('Authentication failed. Please log in again.');
        }
      } else {
        console.error('Failed to fetch GPS data:', error);
        toast.error('Failed to load GPS data. Please try again.');
        setError('Failed to load GPS data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllGpsData();
  }, [fetchAllGpsData]);

  // Polling every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(fetchAllGpsData, 300000);
    return () => clearInterval(intervalId);
  }, [fetchAllGpsData]);

  const calculateDistance = (points: GpsPoint[]): number => {
    let distance = 0;
    for (let i = 1; i < points.length; i++) {
      distance += haversineDistance(
        { lat: points[i-1].latitude, lon: points[i-1].longitude },
        { lat: points[i].latitude, lon: points[i].longitude }
      );
    }
    setTotalDistance(distance / 1000); // km
    return distance;
  };

  const haversineDistance = (p1: { lat: number; lon: number }, p2: { lat: number; lon: number }): number => {
    const R = 6371e3; // metres
    const φ1 = p1.lat * Math.PI/180;
    const φ2 = p2.lat * Math.PI/180;
    const Δφ = (p2.lat-p1.lat) * Math.PI/180;
    const Δλ = (p2.lon-p1.lon) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // in metres
  };

  useEffect(() => {
    if (gpsPoints.length > 0 && !mapRef) {
      const map = L.map('map').setView([gpsPoints[0].latitude, gpsPoints[0].longitude], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      const coords = gpsPoints.map(p => [p.latitude, p.longitude]);
      L.polyline(coords, {color: 'blue'}).addTo(map);
      setTotalDistance(calculateDistance(gpsPoints));
      mapRef.current = map;
    }
  }, [gpsPoints]);

  if (loading) {
    return <div>Loading GPS map...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="gps-map-component">
      <h2>GPS Route</h2>
      <p>Total Distance: {totalDistance.toFixed(2)} km</p>
      <div id="map" style={{height: '400px', width: '100%'}}></div>
    </div>
  );
};

export default GpsMapComponent;