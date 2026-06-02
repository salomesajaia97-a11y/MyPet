export type ServiceCategory = "vet-clinics" | "pet-hotels" | "pet-shops" | "pet-friendly";

export interface BusinessHours {
  open: string;   // "09:00"
  close: string;  // "18:00"
  closed: boolean;
}

export interface Business {
  _id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  address: string;
  neighborhood: string;
  city: string;
  phone: string;
  website?: string;
  images: string[];
  tags: string[];
  // vet-specific
  is24h?: boolean;
  hasEmergency?: boolean;
  // hotel-specific
  pricePerNight?: number;
  capacity?: number;
  // pet-friendly place specific
  indoorAllowed?: boolean;
  // aggregated
  aggregateRating: number;   // 0-5
  googleRatingCount: number;
  nativeRatingCount: number;
  createdAt: string;
}
