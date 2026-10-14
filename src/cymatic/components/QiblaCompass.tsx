/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * High-Precision Qibla Compass Component
 * Accesses device geolocation and magnetometer/compass hardware to point towards the Holy Kaaba.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Compass,
  Navigation,
  MapPin,
  RefreshCw,
  Volume2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  Info,
  Sparkles,
  RotateCw
} from 'lucide-react';
import {
  PrayerCalculationEngine,
  CITY_PRESETS,
  CityPreset,
  KAABA_COORDINATES
} from '../utils/prayerCalculationService';
import { SpiritualNotifications } from '../utils/spiritualNotificationService';

export interface QiblaCompassProps {
  onLocationChange?: (lat: number, lng: number, city: string) => void;
  compact?: boolean;
}

export default function QiblaCompass({ onLocationChange, compact = false }: QiblaCompassProps) {
  // Geolocation state
  const [latitude, setLatitude] = useState<number>(() => {
    return SpiritualNotifications.getState().config.latitude || KAABA_COORDINATES.lat;
  });
  const [longitude, setLongitude] = useState<number>(() => {
    return SpiritualNotifications.getState().config.longitude || KAABA_COORDINATES.lng;
  });
  const [cityName, setCityName] = useState<string>(() => {
    return SpiritualNotifications.getState().config.cityName || 'Makkah';
  });
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string>('');

  // Hardware Compass Sensor State
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasHardwareSensor, setHasHardwareSensor] = useState<boolean>(false);
  const [permissionRequested, setPermissionRequested] = useState<boolean>(false);
  const [needsPermissionGrant, setNeedsPermissionGrant] = useState<boolean>(false);
  const [manualOffset, setManualOffset] = useState<number>(0);
  const [soundFeedback, setSoundFeedback] = useState<boolean>(true);
  const lastVibrationRef = useRef<number>(0);

  // Check iOS 13+ permission requirement on mount
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as any)?.requestPermission === 'function'
    ) {
      setNeedsPermissionGrant(true);
    }
  }, []);

  // Compute Qibla mathematical metrics
  const qiblaData = useMemo(() => {
    return PrayerCalculationEngine.calculateQibla(latitude, longitude);
  }, [latitude, longitude]);

  // Request iOS Sensor Permissions
  const handleRequestSensorPermission = async () => {
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setNeedsPermissionGrant(false);
          setPermissionRequested(true);
          setupOrientationListeners();
        } else {
          setGpsError('Compass sensor access was denied by iOS permissions.');
        }
      } catch (err: any) {
        setGpsError('Error requesting compass sensor: ' + err.message);
      }
    } else {
      setupOrientationListeners();
    }
  };

  // Setup orientation listeners for Android Chrome & iOS Safari
  const setupOrientationListeners = useCallback(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading: number | null = null;

      // iOS Safari (True North or Magnetic)
      if ((e as any).webkitCompassHeading !== undefined && (e as any).webkitCompassHeading !== null) {
        heading = (e as any).webkitCompassHeading;
      }
      // Android Chrome (Absolute orientation)
      else if (e.alpha !== null && e.absolute) {
        heading = (360 - e.alpha) % 360;
      } else if (e.alpha !== null) {
        heading = (360 - e.alpha) % 360;
      }

      if (heading !== null && !isNaN(heading)) {
        setDeviceHeading(Math.round(heading));
        setHasHardwareSensor(true);
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      if ('ondeviceorientationabsolute' in window) {
        (window as any).addEventListener('deviceorientationabsolute', handleOrientation, true);
      } else {
        (window as any).addEventListener('deviceorientation', handleOrientation, true);
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        (window as any).removeEventListener('deviceorientation', handleOrientation);
        (window as any).removeEventListener('deviceorientationabsolute', handleOrientation);
      }
    };
  }, []);

  useEffect(() => {
    if (!needsPermissionGrant) {
      const cleanup = setupOrientationListeners();
      return cleanup;
    }
  }, [needsPermissionGrant, setupOrientationListeners]);

  // Current effective heading (hardware sensor or manual dial)
  const currentHeading = hasHardwareSensor ? deviceHeading : manualOffset;

  // Relative rotation from current heading to Kaaba direction
  const relativeQiblaAngle = (qiblaData.bearing - currentHeading + 360) % 360;

  // Angular difference to Qibla (0° to 180°)
  const angleDifference = relativeQiblaAngle <= 180 ? relativeQiblaAngle : 360 - relativeQiblaAngle;
  const isAligned = angleDifference <= 4; // True if within ±4 degrees

  // Haptic & Sound vibration feedback on alignment
  useEffect(() => {
    if (isAligned) {
      const now = Date.now();
      // Throttle vibration every 2.5 seconds
      if (now - lastVibrationRef.current > 2500) {
        lastVibrationRef.current = now;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([60, 40, 60]);
          } catch (e) {
            // Ignore if vibration is blocked
          }
        }
      }
    }
  }, [isAligned]);

  // High-accuracy Geolocation Retrieval
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        const acc = Math.round(pos.coords.accuracy);

        setLatitude(lat);
        setLongitude(lng);
        setGpsAccuracy(acc);
        const name = `GPS (${lat > 0 ? lat + '°N' : -lat + '°S'}, ${lng > 0 ? lng + '°E' : -lng + '°W'})`;
        setCityName(name);
        setGpsLoading(false);

        // Notify global spiritual engine and parent
        SpiritualNotifications.setLocation(lat, lng, name, true);
        if (onLocationChange) onLocationChange(lat, lng, name);
      },
      (err) => {
        setGpsError(`GPS Error (${err.code}): ${err.message}`);
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  const handleSelectCityPreset = (city: CityPreset) => {
    setLatitude(city.lat);
    setLongitude(city.lng);
    setCityName(city.name);
    setGpsAccuracy(null);
    setGpsError('');

    SpiritualNotifications.setLocation(city.lat, city.lng, city.name, false);
    if (onLocationChange) onLocationChange(city.lat, city.lng, city.name);
  };

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 ${compact ? 'max-w-md' : 'w-full'}`}>
      {/* Header & Hardware Sensor Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Compass size={18} className="text-emerald-400" /> Qibla Compass Locator
          </h3>
          <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">
            Spherical alignment &amp; hardware orientation pointing towards the Kaaba
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
              hasHardwareSensor
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                : 'bg-gray-950 text-gray-400 border-gray-800'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${hasHardwareSensor ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
            {hasHardwareSensor ? 'Hardware Magnetometer Live' : 'Manual / Desktop Dial'}
          </span>
        </div>
      </div>

      {/* Permission Grant Banner for iOS devices */}
      {needsPermissionGrant && !permissionRequested && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-300">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Info size={16} />
            <span>Hardware Compass Access Required (iOS Safari)</span>
          </div>
          <button
            onClick={handleRequestSensorPermission}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shrink-0"
          >
            Enable Sensor
          </button>
        </div>
      )}

      {/* Location Bar with GPS Auto-detection & City Selector */}
      <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <MapPin size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">{cityName}</span>
              <span className="text-[10px] font-mono text-gray-500">
                ({latitude.toFixed(3)}°, {longitude.toFixed(3)}°)
              </span>
              {gpsAccuracy && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-gray-900 text-emerald-400 border border-emerald-500/20">
                  ±{gpsAccuracy}m GPS
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
              Target Kaaba: <strong>21.4225° N, 39.8262° E</strong> (Makkah al-Mukarramah)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleDetectGPS}
            disabled={gpsLoading}
            className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-700 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
          >
            <RefreshCw size={12} className={gpsLoading ? 'animate-spin text-emerald-400' : 'text-emerald-400'} />
            {gpsLoading ? 'Detecting GPS...' : 'Auto-Detect GPS'}
          </button>

          <div className="relative inline-block">
            <select
              value={cityName}
              onChange={(e) => {
                const found = CITY_PRESETS.find((c) => c.name === e.target.value);
                if (found) handleSelectCityPreset(found);
              }}
              className="bg-gray-900 border border-gray-700 text-gray-300 text-[10px] font-bold rounded-xl px-3 py-2 appearance-none pr-7 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="" disabled>Select Preset City</option>
              {CITY_PRESETS.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}, {c.country}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {gpsError && (
        <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-400 font-mono flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* COMPASS VISUALIZATION CANVAS */}
      <div className="flex flex-col lg:flex-row items-center justify-around gap-8 p-4 bg-gray-950/70 rounded-3xl border border-gray-800/80">
        {/* Animated Compass Dial */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center select-none">
          {/* Outer Compass Bezel */}
          <div
            className={`absolute inset-0 rounded-full border-4 bg-gray-950 shadow-2xl transition-all duration-300 ${
              isAligned
                ? 'border-emerald-500/80 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
                : 'border-gray-800 shadow-inner'
            }`}
          />

          {/* Outer Graduation Ring (Rotating with Device Heading) */}
          <div
            className="absolute inset-2 rounded-full transition-transform duration-200 ease-out flex items-center justify-center pointer-events-none"
            style={{
              transform: `rotate(${-currentHeading}deg)`
            }}
          >
            {/* Cardinal Markers */}
            <span className="absolute top-2.5 text-xs font-black text-red-400 font-mono tracking-wider">N</span>
            <span className="absolute bottom-2.5 text-xs font-black text-gray-500 font-mono tracking-wider">S</span>
            <span className="absolute right-3.5 text-xs font-black text-gray-500 font-mono tracking-wider">E</span>
            <span className="absolute left-3.5 text-xs font-black text-gray-500 font-mono tracking-wider">W</span>

            {/* Intercardinal Sub-ticks */}
            <span className="absolute top-7 right-7 text-[8px] font-mono text-gray-600">NE</span>
            <span className="absolute bottom-7 right-7 text-[8px] font-mono text-gray-600">SE</span>
            <span className="absolute bottom-7 left-7 text-[8px] font-mono text-gray-600">SW</span>
            <span className="absolute top-7 left-7 text-[8px] font-mono text-gray-600">NW</span>

            {/* Dial Hash Marks */}
            <div className="absolute inset-5 rounded-full border border-dashed border-gray-800/90" />
          </div>

          {/* Direct Qibla Pointer Needle */}
          <div
            className="absolute inset-6 rounded-full transition-transform duration-300 ease-out flex items-center justify-center pointer-events-none"
            style={{
              transform: `rotate(${relativeQiblaAngle}deg)`
            }}
          >
            {/* North-facing Kaaba Needle */}
            <div className="absolute top-0 flex flex-col items-center">
              <div
                className={`w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[30px] transition-all ${
                  isAligned
                    ? 'border-b-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.9)] scale-110'
                    : 'border-b-amber-400'
                }`}
              />
              <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider mt-1 border shadow-lg ${
                isAligned
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-400'
                  : 'bg-gray-900 text-white border-gray-700'
              }`}>
                KAABA
              </div>
            </div>

            {/* Counter-balance tail */}
            <div className="absolute bottom-0 flex flex-col items-center">
              <div className="w-1.5 h-8 bg-gray-700/80 rounded-full" />
            </div>
          </div>

          {/* Fixed Top Sighting Benchmark (Where user is looking) */}
          <div className="absolute top-0 -translate-y-1 w-2 h-4 bg-emerald-400 rounded-b shadow-[0_0_10px_rgba(16,185,129,0.8)] z-20 pointer-events-none" />

          {/* Center Hub Display */}
          <div
            className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center text-center shadow-2xl transition-all z-10 ${
              isAligned
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105'
                : 'bg-gray-950 border-gray-700 text-gray-300'
            }`}
          >
            <span className="text-xs font-mono font-black">{Math.round(qiblaData.bearing)}°</span>
            <span className="text-[8px] font-mono uppercase font-bold text-gray-400">{qiblaData.cardinal}</span>
          </div>
        </div>

        {/* Alignment Metrics & Real-Time Feedback Panel */}
        <div className="space-y-4 max-w-sm w-full">
          {/* Main Status Pill */}
          <div
            className={`p-4 rounded-2xl border text-center transition-all ${
              isAligned
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-950/30 animate-pulse'
                : 'bg-gray-950 border-gray-800 text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              {isAligned ? (
                <CheckCircle2 size={18} className="text-emerald-400" />
              ) : (
                <Navigation size={18} className="text-amber-400 transform rotate-45" />
              )}
              <span className="text-xs font-black uppercase tracking-wider">
                {isAligned ? 'Aligned Directly with Kaaba' : 'Align Device with Needle'}
              </span>
            </div>

            <p className="text-[11px] font-mono text-gray-400">
              {isAligned
                ? 'Facing Makkah al-Mukarramah. Ready for canonical Salah.'
                : `Rotate device ${Math.round(angleDifference)}° ${relativeQiblaAngle > 180 ? 'left (counter-clockwise)' : 'right (clockwise)'} to face Qibla.`}
            </p>
          </div>

          {/* Precision Coordinates & Metrics Card */}
          <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800 space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center text-gray-400">
              <span>Qibla True Bearing:</span>
              <strong className="text-emerald-400 font-bold">{qiblaData.bearing}° {qiblaData.cardinal}</strong>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Current Device Heading:</span>
              <strong className="text-white">{currentHeading}°</strong>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Distance to Kaaba:</span>
              <strong className="text-white">
                {qiblaData.distanceKm.toLocaleString()} km ({Math.round(qiblaData.distanceKm * 0.621371).toLocaleString()} mi)
              </strong>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Kaaba Coordinates:</span>
              <span className="text-gray-500">21.4225° N, 39.8262° E</span>
            </div>
          </div>

          {/* Desktop Fallback Manual Slider */}
          {!hasHardwareSensor && (
            <div className="p-4 bg-gray-950/60 rounded-2xl border border-gray-800 space-y-2">
              <div className="flex justify-between text-[11px] font-mono text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Sliders size={13} className="text-emerald-400" /> Simulated Heading:
                </span>
                <span className="text-emerald-400 font-bold">{manualOffset}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={manualOffset}
                onChange={(e) => setManualOffset(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-gray-800 h-2 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[9px] text-gray-500 font-sans">
                Notice: On mobile devices with magnetic sensors, tilt the phone horizontally to read live magnetic compass.
              </p>
            </div>
          )}

          {/* Quick Adhan & Sound Controls */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => SpiritualNotifications.triggerManualSound('islamic')}
              className="px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              <Volume2 size={13} /> Test Adhan Call
            </button>

            <button
              onClick={handleDetectGPS}
              className="text-[10px] font-mono text-gray-500 hover:text-white transition-colors flex items-center gap-1"
            >
              <RotateCw size={11} /> Refresh Coordinates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
