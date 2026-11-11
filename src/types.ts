export interface Location {
  latitude: number;
  longitude: number;
}

export type JobType = 'delivery' | 'ride';

export interface Order {
  id: string;
  type: JobType;
  restaurantName?: string;
  restaurantLocation?: Location;
  customerLocation: Location;
  pickupLocation?: Location;
  estimatedPay: number;
  estimatedDistance: number;
  estimatedTime: number;
  status: 'pending' | 'accepted' | 'preparing_pickup' | 'en_route_to_pickup' | 'arrived_at_pickup' | 'picked_up' | 'on_ride' | 'arriving' | 'arrived' | 'delivered' | 'returning_to_restaurant' | 'scanning_receipt';
  customerName: string;
  items?: string[];
  pin?: string;
  isMatching?: boolean;
  surge?: number;
  riderRating?: number;
  isStacked?: boolean;
  batchCount?: number;
  verificationMethod?: 'photo' | 'pin' | 'none';
  receiptRequired?: boolean;
  receiptVerified?: boolean;
  baseFare?: number;
  mileageRate?: number;
  timeRate?: number;
  surgeMultiplier?: number;
  pickupPos?: { lat: number, lng: number };
  dropoffPos?: { lat: number, lng: number };
  brand?: 'uber' | 'hyper';
  isPreBooking?: boolean;
  scheduledTimeStr?: string;
  isTowardsDestination?: boolean;
  destinationFilterAddress?: string;
}

export interface DestinationFilter {
  active: boolean;
  address: string;
  shortName: string;
  location: Location;
  distanceMi: number;
  estimatedMinutes: number;
  setAt: number;
}

export interface NavSimulation {
  active: boolean;
  orderId: string;
  type: 'pickup' | 'dropoff' | 'busy_area';
  startPos: { lat: number, lng: number };
  endPos: { lat: number, lng: number };
  currentPos: { lat: number, lng: number };
  progress: number;
  distanceRemaining: number;
  eta: number;
  speed: number;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  sender: 'driver' | 'customer';
  text: string;
  timestamp: number;
}

export interface ScheduledOrder {
  id: string;
  driverUid: string;
  restaurantName: string;
  scheduledTime: any;
  status: 'pending' | 'active' | 'completed';
  estimatedPay: number;
  brand?: 'uber' | 'hyper';
  distanceMiles?: number;
  durationMinutes?: number;
  vehicleClass?: string;
  destinationName?: string;
  notes?: string;
  type?: 'ride' | 'delivery';
}

export type AppScreen = 'onboarding' | 'documents' | 'face_verification' | 'home' | 'earnings' | 'inbox' | 'account' | 'chat' | 'hyper_driver_pro' | 'wallet' | 'opportunities' | 'safety' | 'earnings_detail' | 'banking' | 'scheduled_orders' | 'rewards' | 'carplay_dashboard' | 'trip_history' | 'work_hub' | 'ratings' | 'planner' | 'hyper_driver_services' | 'vehicle_details' | 'payment_methods' | 'trip_preferences' | 'personal_details' | 'insurance' | 'audio_settings' | 'multiplayer_hub' | 'airport_queues' | 'command_centre';

export interface CompletedTrip {
  id: string;
  restaurantName?: string;
  customerName: string;
  earnings: number;
  distance: number;
  timestamp: number;
  type: JobType;
  breakdown?: {
    base: number;
    distancePay: number;
    timePay: number;
    surge: number;
    surgeMultiplier?: number;
    tip: number;
  };
}

export type HyperProTier = 'Blue' | 'Gold' | 'Platinum' | 'Diamond';

export interface Mission {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  pointsReward: number;
  cashReward: number;
  completed: boolean;
  type: 'delivery_count' | 'earnings_goal' | 'rating_streak';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  rewardType: 'xp' | 'cash' | 'fuel';
  rewardValue: number;
  completed: boolean;
  type: 'daily' | 'weekly';
}

export interface UserProfile {
  uid?: string;
  email?: string;
  name: string;
  rating: number;
  tier: HyperProTier;
  points: number;
  experience: number; // For progression
  level: number;
  deliveries: number;
  deliveriesToday: number;
  lifetimeTrips?: number;
  badges?: string[];
  compliments?: { type: string, count: number }[];
  earningsStats?: {
    daily: number;
    weekly: number;
    monthly: number;
    ytd: number;
  };
  rides: number;
  acceptanceRate: number;
  cancellationRate: number;
  onTimeRate?: number;
  todayEarnings?: number;
  todayDeliveries?: number;
  latitude?: number;
  longitude?: number;
  heading?: number;
  isOnline: boolean;
  documentsUploaded: boolean;
  faceVerified: boolean;
  dob?: string;
  nationality?: string;
  phone?: string;
  address?: string;
  profilePic?: string;
  documentExpiries?: Record<string, string>;
  walletBalance: number;
  activeMissions?: Mission[];
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    color?: string;
    plate: string;
    type: string;
    photo?: string;
    taxiPlate?: string;
    taxiPhone?: string;
  };
  vehiclesList?: {
    id: string;
    make: string;
    model: string;
    year: number;
    color?: string;
    plate: string;
    type: string;
    photo?: string;
    taxiPlate?: string;
    taxiPhone?: string;
  }[];
  paymentMethods?: {
    id: string;
    type: 'card' | 'bank' | 'stripe';
    last4: string;
    bankName?: string;
    isDefault: boolean;
    accountHolder?: string;
    sortCode?: string;
    isReal?: boolean;
  }[];
  fcmToken?: string;
}
