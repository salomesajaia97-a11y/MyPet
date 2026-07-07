export type MarketplaceType = "buy-sell" | "adoption" | "mating" | "lost-found";

export type PetSpecies = "dog" | "cat" | "bird" | "rabbit" | "reptile" | "other";

export interface BaseListing {
  _id: string;
  type: MarketplaceType;
  species: PetSpecies;
  breed: string;
  age: number;        // months
  images: string[];
  description: string;
  location: string;
  contactName: string;
  contactPhone: string;
  createdAt: string;
  userId: string;
  // Paid VIP promotion. `isVip` is set only after payment (or by an admin);
  // `vipUntil` is the expiry of the paid period (null = no expiry). A listing
  // surfaces in the homepage VIP row only while both hold — see isVipActive().
  isVip?: boolean;
  vipUntil?: string | null;
}

export interface BuySellListing extends BaseListing {
  type: "buy-sell";
  price: number;
  currency: "GEL" | "USD";
  vaccinated: boolean;
  hasPassport: boolean;
  pedigree: "FCI" | "FCG" | "none";
}

export interface AdoptionListing extends BaseListing {
  type: "adoption";
  temperament: string[];
  spayedNeutered: boolean;
  goodWithKids: boolean;
  goodWithPets: boolean;
}

export interface MatingListing extends BaseListing {
  type: "mating";
  sex: "male" | "female";
  weight: number;       // kg
  pedigree: "FCI" | "FCG" | "none";
  price: number | null; // null = free
}

export interface LostFoundListing extends BaseListing {
  type: "lost-found";
  status: "lost" | "found";
  neighborhood: string;
  lastSeenDate: string;
  reward: number | null;
  isResolved: boolean;
}

export type Listing = BuySellListing | AdoptionListing | MatingListing | LostFoundListing;
