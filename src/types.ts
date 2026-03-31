export type UserRole = 'admin' | 'user' | 'delivery';

export interface HealthTrend {
  date: string;
  glucose: number;
  cholesterol: number;
  vitaminD: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  phoneNumber?: string;
  address?: string;
  referralCode?: string;
  referredBy?: string;
  referralEarnings?: number;
  withdrawableBalance?: number;
  location?: { lat: number; lng: number };
  isAvailable?: boolean;
  healthScore?: number;
  healthTrends?: HealthTrend[];
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  status: 'pending' | 'completed';
  amount: number;
  createdAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type DeliveryStatus = 'assigned' | 'on_the_way' | 'sampled' | 'delivered';

export interface Booking {
  id: string;
  userUid: string;
  testIds?: string[];
  packageIds?: string[];
  status: BookingStatus;
  paymentStatus?: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  upiPaymentId?: string;
  date: string;
  time?: string;
  patientName?: string;
  totalAmount: number;
  address?: string;
  userLocation?: { lat: number; lng: number };
  assignedTo?: string; // Delivery boy UID
  deliveryStatus?: DeliveryStatus;
  deliveryBoyLocation?: { lat: number; lng: number };
  createdAt: string;
}

export interface Package {
  id: string;
  name: string;
  description?: string;
  price: number;
  tests?: string[];
  category?: string;
  createdAt: string;
}

export interface Test {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  bookingId: string;
  userUid: string;
  fileUrl?: string;
  status: 'pending' | 'ready';
  createdAt: string;
}

export interface SiteSettings {
  id: string;
  data: Record<string, any>;
}

export interface KnowledgePost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  readTime: string;
  createdAt: string;
}
