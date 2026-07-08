import type { marketplace as ka } from "../ka/marketplace";

export const marketplace: typeof ka = {
  // sr-only page headings
  titleBuySell: "Buy & Sell Pets",
  titleAdoption: "Pets for Adoption",
  titleMating: "Mating",
  titleLostFound: "Lost & Found Pets",

  // empty states
  emptyBuySell: "No listings yet. Be the first!",
  noListings: "No listings found",

  // listing-card chrome
  puppy: "Puppy",
  vaccinated: "Vaccinated",
  pedigree: "Pedigree",
  spayedNeutered: "Spayed/Neutered",
  goodWithKids: "Good with kids",
  free: "Free",
  sexMale: "Male",
  sexFemale: "Female",
  statusLost: "Lost",
  statusFound: "Found",

  // species labels (keyed by DB slug)
  species: {
    dog: "Dog",
    cat: "Cat",
    bird: "Bird",
    rabbit: "Rabbit",
    reptile: "Reptile",
    other: "Other",
  },

  // age / weight units
  units: {
    month: "mo",
    year: "yr",
    kg: "kg",
  },

  // AI photo-search entry point
  aiPhotoSearch: "AI Photo Search",
  aiPhotoSearchDesc: "Upload a photo — AI will find a similar lost/found pet",

  // pager
  pagerLabel: "Pages",
  prev: "Previous",
  next: "Next",
  page: "Page",

  // tabs (buy-sell tab label differs from the shared category label)
  tabBuySell: "Buy/Sell",

  // search + filter bar
  searchByBreedPlaceholder: "Search by breed...",
  searchButton: "Search",
  speciesFilterLabel: "Species",
  allTypes: "All types",
  cityFilterLabel: "City",
  allCities: "All cities",
  priceFrom: "Price from ₾",
  priceTo: "Price to ₾",
  minPriceLabel: "Minimum price",
  maxPriceLabel: "Maximum price",
  pedigreeFilterLabel: "Pedigree",
  pedigreeAll: "Pedigree: all",
  pedigreeNone: "No pedigree",
  sexFilterLabel: "Sex",
  sexAll: "Sex: all",
  statusFilterLabel: "Status",
  statusAll: "Status: all",
  statusLostOption: "Lost",
  statusFoundOption: "Found",
  clearFilters: "Clear",

  // AI photo-match page
  matchIntro:
    "Upload a pet photo — AI will compare it against lost/found listing photos and show possible matches.",
  uploadPrompt: "Click to upload a photo",
  needLoginPrefix: "To use visual search",
  loginLink: "sign in",
  comparing: "Comparing…",
  findMatches: "Find matches",
  noMatches: "No matches found.",
  animalFallback: "Pet",
  conf: {
    high: "High probability",
    medium: "Medium probability",
    low: "Low probability",
  },
  errOnlyImage: "JPEG, PNG or WebP only.",
  errNeedLogin: "Sign in to use visual search.",
  errServiceUnavailable: "The AI matcher isn't enabled yet.",
  errGeneric: "Something went wrong.",
  errRetry: "Something went wrong. Try again.",
};
