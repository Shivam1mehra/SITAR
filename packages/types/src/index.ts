// Core Entity Types
export interface Tourist {
  id: string;
  did: string; // Decentralized Identifier
  name: string;
  nationality: string;
  phoneNumber: string;
  email?: string;
  kycVerified: boolean;
  kycDocument: KYCDocument;
  emergencyContacts: EmergencyContact[];
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KYCDocument {
  type: 'aadhaar' | 'passport' | 'visa';
  number: string;
  expiryDate?: Date;
  issuingCountry?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  isPrimary: boolean;
}

export interface Trip {
  id: string;
  touristId: string;
  did: string;
  startDate: Date;
  endDate: Date;
  purpose: string;
  itinerary: ItineraryPoint[];
  status: TripStatus;
  safetyScore: number;
  consentFlags: ConsentFlags;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItineraryPoint {
  id: string;
  name: string;
  description?: string;
  coordinates: GeoCoordinates;
  scheduledTime?: Date;
  duration?: number; // minutes
  category: 'accommodation' | 'attraction' | 'transport' | 'other';
}

export interface ConsentFlags {
  realTimeTracking: boolean;
  dataSharing: boolean;
  emergencyResponse: boolean;
  analyticsParticipation: boolean;
}

export type TripStatus = 'planned' | 'active' | 'completed' | 'cancelled' | 'emergency';

// Location and Geofencing Types
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

export interface LocationData {
  id: string;
  touristId: string;
  did: string;
  coordinates: GeoCoordinates;
  timestamp: Date;
  speed?: number;
  bearing?: number;
  batteryLevel?: number;
  isManual: boolean;
  deviceInfo?: DeviceInfo;
}

export interface DeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android';
  version: string;
  model: string;
  connectivity: ConnectivityStatus;
}

export interface ConnectivityStatus {
  isOnline: boolean;
  networkType: 'wifi' | 'cellular' | 'none';
  signalStrength?: number;
}

export interface Geofence {
  id: string;
  name: string;
  description?: string;
  type: GeofenceType;
  geometry: GeoGeometry;
  riskLevel: RiskLevel;
  activeSchedule?: TimeSchedule;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type GeofenceType = 'safe_zone' | 'restricted_zone' | 'high_risk_zone' | 'emergency_zone' | 'tourist_spot';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface GeoGeometry {
  type: 'Point' | 'Polygon' | 'Circle';
  coordinates: number[] | number[][] | number[][][];
  radius?: number; // for circles
}

export interface TimeSchedule {
  timezone: string;
  schedules: TimeSlot[];
}

export interface TimeSlot {
  dayOfWeek: number[]; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

// Alert and Incident Types
export interface Alert {
  id: string;
  touristId: string;
  did: string;
  type: AlertType;
  severity: Severity;
  status: AlertStatus;
  title: string;
  message: string;
  coordinates: GeoCoordinates;
  metadata: AlertMetadata;
  assignedOfficerId?: string;
  responseTime?: number; // seconds
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AlertType = 
  | 'panic_button'
  | 'geofence_breach'
  | 'route_deviation'
  | 'prolonged_inactivity'
  | 'device_offline'
  | 'anomaly_detected'
  | 'health_emergency'
  | 'missing_person';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'false_alarm';

export interface AlertMetadata {
  confidence?: number;
  reasonCodes: string[];
  contextData?: Record<string, any>;
  evidenceUrls?: string[];
  witnesses?: string[];
}

// Safety Scoring
export interface SafetyScore {
  touristId: string;
  did: string;
  currentScore: number;
  factors: SafetyFactors;
  lastUpdated: Date;
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

export interface SafetyFactors {
  locationRisk: number;
  timeRisk: number;
  activityRisk: number;
  deviationRisk: number;
  deviceHealth: number;
}

// Authority and Response Types
export interface PoliceOfficer {
  id: string;
  name: string;
  badgeNumber: string;
  rank: string;
  station: string;
  phoneNumber: string;
  email: string;
  currentLocation?: GeoCoordinates;
  isAvailable: boolean;
  expertise: string[];
  languages: string[];
}

export interface PoliceUnit {
  id: string;
  name: string;
  type: 'patrol' | 'emergency' | 'tourist_police' | 'cyber_crime';
  officers: string[]; // officer IDs
  currentLocation?: GeoCoordinates;
  isAvailable: boolean;
  equipment: string[];
  jurisdiction: string;
}

export interface Incident {
  id: string;
  alertId: string;
  firNumber?: string;
  status: IncidentStatus;
  priority: Priority;
  category: IncidentCategory;
  description: string;
  location: GeoCoordinates;
  reportedBy: string;
  assignedUnits: string[];
  witnesses: Witness[];
  evidence: Evidence[];
  timeline: IncidentEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export type IncidentStatus = 'reported' | 'investigating' | 'resolved' | 'closed';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type IncidentCategory = 
  | 'missing_person'
  | 'medical_emergency'
  | 'crime'
  | 'accident'
  | 'natural_disaster'
  | 'terrorist_threat'
  | 'other';

export interface Witness {
  name?: string;
  phoneNumber?: string;
  statement: string;
  contactedAt: Date;
}

export interface Evidence {
  id: string;
  type: 'photo' | 'video' | 'audio' | 'document' | 'other';
  url: string;
  hash: string;
  description?: string;
  collectedBy: string;
  collectedAt: Date;
  chainOfCustody: ChainOfCustodyEntry[];
}

export interface ChainOfCustodyEntry {
  handedBy: string;
  receivedBy: string;
  timestamp: Date;
  purpose: string;
  location: string;
}

export interface IncidentEvent {
  id: string;
  type: string;
  description: string;
  performedBy: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// AI/ML Types
export interface AnomalyDetection {
  touristId: string;
  did: string;
  anomalyType: AnomalyType;
  confidence: number;
  description: string;
  features: Record<string, number>;
  threshold: number;
  timestamp: Date;
  context: AnomalyContext;
}

export type AnomalyType = 
  | 'location_jump'
  | 'speed_anomaly'
  | 'route_deviation'
  | 'time_anomaly'
  | 'activity_anomaly'
  | 'device_behavior';

export interface AnomalyContext {
  previousLocations: GeoCoordinates[];
  expectedRoute?: GeoCoordinates[];
  timeContext: string;
  weatherConditions?: string;
  localEvents?: string[];
}

// Blockchain Types
export interface DigitalIdentity {
  did: string;
  vcHash: string;
  issuer: string;
  subject: string;
  issuanceDate: Date;
  expirationDate: Date;
  revoked: boolean;
  revocationReason?: string;
  blockchainTxId: string;
}

export interface VerifiableCredential {
  '@context': string[];
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: CredentialSubject;
  proof: Proof;
}

export interface CredentialSubject {
  id: string;
  touristData: {
    name: string;
    nationality: string;
    kycVerified: boolean;
    tripDuration: {
      start: string;
      end: string;
    };
    emergencyContacts: EmergencyContact[];
  };
}

export interface Proof {
  type: string;
  created: string;
  creator: string;
  signatureValue: string;
}

// IoT Types
export interface IoTDevice {
  id: string;
  type: 'smart_band' | 'beacon' | 'sensor' | 'camera';
  touristId?: string;
  location?: GeoCoordinates;
  batteryLevel: number;
  isActive: boolean;
  lastHeartbeat: Date;
  firmware: string;
  capabilities: DeviceCapability[];
}

export interface DeviceCapability {
  type: string;
  enabled: boolean;
  configuration: Record<string, any>;
}

export interface IoTSensorData {
  deviceId: string;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: Date;
  quality: 'good' | 'fair' | 'poor';
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: ResponseMetadata;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ResponseMetadata {
  timestamp: Date;
  requestId: string;
  version: string;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// WebSocket Events
export type WebSocketEventType = 
  | 'location_update'
  | 'alert_created'
  | 'alert_updated'
  | 'geofence_breach'
  | 'safety_score_update'
  | 'incident_update'
  | 'officer_location_update';

export interface WebSocketEvent<T = any> {
  type: WebSocketEventType;
  payload: T;
  timestamp: Date;
  source: string;
  targetAudience?: string[];
}

// Analytics Types
export interface TouristAnalytics {
  totalTourists: number;
  activeTourists: number;
  touristsByNationality: Record<string, number>;
  safetyScoreDistribution: Record<string, number>;
  alertStatistics: AlertStatistics;
  popularDestinations: PopularDestination[];
  riskyAreas: RiskyArea[];
}

export interface AlertStatistics {
  totalAlerts: number;
  alertsByType: Record<AlertType, number>;
  alertsBySeverity: Record<Severity, number>;
  averageResponseTime: number;
  resolutionRate: number;
}

export interface PopularDestination {
  name: string;
  coordinates: GeoCoordinates;
  visitCount: number;
  averageStayDuration: number;
  safetyRating: number;
}

export interface RiskyArea {
  name: string;
  coordinates: GeoCoordinates;
  riskLevel: RiskLevel;
  incidentCount: number;
  riskFactors: string[];
}

// Multilingual Support
export interface LocalizedContent {
  [languageCode: string]: string;
}

export type SupportedLanguage = 
  | 'en' // English
  | 'hi' // Hindi
  | 'bn' // Bengali
  | 'te' // Telugu
  | 'mr' // Marathi
  | 'ta' // Tamil
  | 'gu' // Gujarati
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'or' // Odia
  | 'pa' // Punjabi
  | 'as'; // Assamese

// Configuration Types
export interface SystemConfig {
  features: FeatureFlags;
  security: SecurityConfig;
  ai: AIConfig;
  notifications: NotificationConfig;
  geofencing: GeofencingConfig;
}

export interface FeatureFlags {
  blockchainEnabled: boolean;
  iotIntegrationEnabled: boolean;
  realTimeTrackingEnabled: boolean;
  aiAnomalyDetectionEnabled: boolean;
  multilanguageEnabled: boolean;
  offlineModeEnabled: boolean;
}

export interface SecurityConfig {
  jwtExpirationTime: string;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireMFA: boolean;
  encryptionAlgorithm: string;
}

export interface AIConfig {
  anomalyDetectionThreshold: number;
  safetyScoreWeights: SafetyFactors;
  modelUpdateInterval: number;
  enablePredictiveAlerts: boolean;
}

export interface NotificationConfig {
  smsEnabled: boolean;
  emailEnabled: boolean;
  pushNotificationsEnabled: boolean;
  whatsappEnabled: boolean;
  emergencyEscalationTime: number;
}

export interface GeofencingConfig {
  defaultSafeZoneRadius: number;
  highRiskAlertDelay: number;
  maxGeofenceRadius: number;
  geofenceCheckInterval: number;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Export all types
export * from './api';
export * from './events';

// Type guards
export const isValidCoordinate = (coord: any): coord is GeoCoordinates => {
  return (
    typeof coord === 'object' &&
    typeof coord.latitude === 'number' &&
    typeof coord.longitude === 'number' &&
    coord.latitude >= -90 &&
    coord.latitude <= 90 &&
    coord.longitude >= -180 &&
    coord.longitude <= 180
  );
};

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+91|91|0)?[6789]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
