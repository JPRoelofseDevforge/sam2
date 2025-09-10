export interface WomenHealthRecord {
  day: string;
  flowRate: number;
  symptoms: number[]; // parsed from JSON array
}

export interface GpsPoint {
  gpsDate: string;
  latitude: number;
  longitude: number;
}

export interface ApneaRecord {
  id: number;
  mac: string;
  day: string;
}