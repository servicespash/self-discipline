/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Open-Source Mathematical Prayer Calculation & Qibla Compass Engine
 * Production-ready astronomical solar algorithms and spherical trigonometry.
 */

export interface PrayerTimesResult {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  nextPrayer: {
    name: string;
    time: string;
    minutesRemaining: number;
  };
}

export interface CityPreset {
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: number;
}

export const CITY_PRESETS: CityPreset[] = [
  { name: 'Makkah', country: 'Saudi Arabia', lat: 21.4225, lng: 39.8262, timezone: 3 },
  { name: 'Madinah', country: 'Saudi Arabia', lat: 24.4672, lng: 39.6111, timezone: 3 },
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, timezone: 0 },
  { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060, timezone: -5 },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, timezone: 2 },
  { name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708, timezone: 4 },
  { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784, timezone: 3 },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, timezone: 7 },
  { name: 'Kampala', country: 'Uganda', lat: 0.3476, lng: 32.5825, timezone: 3 },
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219, timezone: 3 },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, timezone: 1 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832, timezone: -5 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, timezone: 8 }
];

export const KAABA_COORDINATES = {
  lat: 21.4225,
  lng: 39.8262
};

export class PrayerCalculationEngine {
  // Convert degrees to radians
  private static d2r(d: number): number {
    return (d * Math.PI) / 180.0;
  }

  // Convert radians to degrees
  private static r2d(r: number): number {
    return (r * 180.0) / Math.PI;
  }

  // Julian date calculation
  private static getJulianDate(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    let y = year;
    let m = month;
    if (m <= 2) {
      y -= 1;
      m += 12;
    }

    const a = Math.floor(y / 100);
    const b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
  }

  // Sun coordinates: Declination and Equation of Time
  private static getSunPosition(jd: number): { declination: number; equationOfTime: number } {
    const d = jd - 2451545.0;
    const g = 357.529 + 0.98560028 * d;
    const q = 280.459 + 0.98564736 * d;
    const l = q + 1.915 * Math.sin(this.d2r(g)) + 0.020 * Math.sin(this.d2r(2 * g));

    const e = 23.439 - 0.00000036 * d;
    const ra = this.r2d(Math.atan2(Math.cos(this.d2r(e)) * Math.sin(this.d2r(l)), Math.cos(this.d2r(l)))) / 15.0;
    const declination = this.r2d(Math.asin(Math.sin(this.d2r(e)) * Math.sin(this.d2r(l))));
    const equationOfTime = (q / 15.0) - (ra < 0 ? ra + 24 : ra);

    return { declination, equationOfTime: equationOfTime * 60.0 }; // EqT in minutes
  }

  // Calculate Sun Transit (Solar Noon)
  private static getTransitTime(lng: number, tz: number, eqt: number): number {
    return 12.0 + tz - (lng / 15.0) - (eqt / 60.0);
  }

  // Calculate hour angle for a given sun angle
  private static getHourAngle(lat: number, dec: number, angle: number): number {
    const latRad = this.d2r(lat);
    const decRad = this.d2r(dec);
    const angleRad = this.d2r(angle);

    const cosH = (Math.sin(angleRad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));
    if (cosH > 1.0) return 0; // Sun never reaches angle (polar night)
    if (cosH < -1.0) return 180; // Polar day
    return this.r2d(Math.acos(cosH));
  }

  // Format decimal hours to HH:MM AM/PM string
  public static formatTime(decimalHours: number): string {
    let hours = Math.floor(decimalHours);
    let minutes = Math.round((decimalHours - hours) * 60);

    if (minutes >= 60) {
      hours += 1;
      minutes = 0;
    }

    hours = ((hours % 24) + 24) % 24;

    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = String(minutes).padStart(2, '0');

    return `${String(displayHours).padStart(2, '0')}:${displayMinutes} ${period}`;
  }

  // Parse formatted time to minutes from midnight
  public static timeStringToMinutes(timeStr: string): number {
    const [timePart, period] = timeStr.split(' ');
    const [hours, minutes] = timePart.split(':').map(Number);
    let total = (hours % 12) * 60 + minutes;
    if (period === 'PM') total += 12 * 60;
    return total;
  }

  // Compute all prayer times for given coordinates and date
  public static calculatePrayerTimes(
    lat: number,
    lng: number,
    date: Date = new Date(),
    fajrAngle: number = 18.0, // Muslim World League standard
    ishaAngle: number = 17.0
  ): PrayerTimesResult {
    const tz = -date.getTimezoneOffset() / 60.0;
    const jd = this.getJulianDate(date);
    const { declination, equationOfTime } = this.getSunPosition(jd);

    const transit = this.getTransitTime(lng, tz, equationOfTime);

    // Fajr (sun 18 deg below horizon: -18)
    const fajrHA = this.getHourAngle(lat, declination, -fajrAngle);
    const fajr = transit - (fajrHA / 15.0);

    // Sunrise (sun 0.833 deg below horizon)
    const sunriseHA = this.getHourAngle(lat, declination, -0.833);
    const sunrise = transit - (sunriseHA / 15.0);

    // Dhuhr (solar noon + slight buffer)
    const dhuhr = transit + (2.0 / 60.0);

    // Asr (Shafi'i: shadow factor = 1)
    const latRad = this.d2r(lat);
    const decRad = this.d2r(declination);
    const asrAngle = this.r2d(Math.atan(1.0 / (1.0 + Math.tan(Math.abs(latRad - decRad)))));
    const asrHA = this.getHourAngle(lat, declination, asrAngle);
    const asr = transit + (asrHA / 15.0);

    // Maghrib (Sunset: sun 0.833 deg below horizon)
    const maghrib = transit + (sunriseHA / 15.0);

    // Isha (sun 17/18 deg below horizon)
    const ishaHA = this.getHourAngle(lat, declination, -ishaAngle);
    const isha = transit + (ishaHA / 15.0);

    const fajrStr = this.formatTime(fajr);
    const sunriseStr = this.formatTime(sunrise);
    const dhuhrStr = this.formatTime(dhuhr);
    const asrStr = this.formatTime(asr);
    const maghribStr = this.formatTime(maghrib);
    const ishaStr = this.formatTime(isha);

    // Determine next prayer
    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const schedule = [
      { name: 'Fajr', str: fajrStr, mins: this.timeStringToMinutes(fajrStr) },
      { name: 'Sunrise', str: sunriseStr, mins: this.timeStringToMinutes(sunriseStr) },
      { name: 'Dhuhr', str: dhuhrStr, mins: this.timeStringToMinutes(dhuhrStr) },
      { name: 'Asr', str: asrStr, mins: this.timeStringToMinutes(asrStr) },
      { name: 'Maghrib', str: maghribStr, mins: this.timeStringToMinutes(maghribStr) },
      { name: 'Isha', str: ishaStr, mins: this.timeStringToMinutes(ishaStr) }
    ];

    let next = schedule.find(p => p.mins > currentMinutes);
    let minutesRemaining = 0;
    if (next) {
      minutesRemaining = next.mins - currentMinutes;
    } else {
      // Past Isha, next is tomorrow's Fajr
      next = schedule[0];
      minutesRemaining = (24 * 60 - currentMinutes) + next.mins;
    }

    return {
      fajr: fajrStr,
      sunrise: sunriseStr,
      dhuhr: dhuhrStr,
      asr: asrStr,
      maghrib: maghribStr,
      isha: ishaStr,
      nextPrayer: {
        name: next.name,
        time: next.str,
        minutesRemaining
      }
    };
  }

  // Calculate Qibla angle from True North (0° to 360°) and distance in kilometers
  public static calculateQibla(lat: number, lng: number): { bearing: number; distanceKm: number; cardinal: string } {
    const phiK = this.d2r(KAABA_COORDINATES.lat);
    const lambdaK = this.d2r(KAABA_COORDINATES.lng);
    const phi = this.d2r(lat);
    const lambda = this.d2r(lng);

    const deltaLambda = lambdaK - lambda;
    const y = Math.sin(deltaLambda);
    const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(deltaLambda);

    let bearing = (this.r2d(Math.atan2(y, x)) + 360.0) % 360.0;
    bearing = Math.round(bearing * 10) / 10;

    // Haversine formula for distance
    const R = 6371; // Earth radius in km
    const dLat = phiK - phi;
    const dLon = lambdaK - lambda;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(phi) * Math.cos(phiK) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Math.round(R * c);

    // Cardinal designation
    const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(bearing / 22.5) % 16;
    const cardinal = cardinals[index];

    return { bearing, distanceKm, cardinal };
  }
}
