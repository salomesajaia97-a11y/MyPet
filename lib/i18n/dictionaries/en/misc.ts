import type { misc as ka } from "../ka/misc";

export const misc: typeof ka = {
  // Global error boundary (app/error.tsx)
  errorTitle: "Something went wrong",
  errorBody: "The page could not be loaded. Please try again.",
  errorRetry: "Try again",
  // Not found (app/not-found.tsx)
  notFoundTitle: "Page not found",
  notFoundBody: "The page you're looking for doesn't exist or has been moved.",
  notFoundHome: "Back to home",
  // Loading spinner (app/loading.tsx)
  loading: "Loading",
  // Image uploader (components/ui/ImageUploader.tsx)
  uploadPhoto: "Photo",
  uploadHintPrefix: "Max.",
  uploadHintSuffix: "photos • JPEG, PNG, WebP • up to 5 MB",
  // Favorite button (components/favorites/FavoriteButton.tsx)
  favoriteRemove: "Remove from favorites",
  favoriteAdd: "Add to favorites",
  // Smart search (components/ai/SmartSearch.tsx)
  searchExample1: "Cheap vaccinated puppy in Tbilisi",
  searchExample2: "Free cat for adoption",
  searchExample3: "Labrador for mating",
  searchDisabled: "AI search is not enabled yet.",
  searchRetryReformulate: "Couldn't complete the search. Try rephrasing.",
  searchRetry: "Couldn't complete the search. Please try again.",
  searchPlaceholder: "Describe in natural language — AI will find it",
  searching: "Searching…",
  aiSearch: "AI Search",
  // API error / fallback messages returned to the client (route handlers)
  validationFailed: "Field validation failed",
  alreadyReviewed: "You have already reviewed this business",
  cannotReviewOwn: "You can't review your own business",
  user: "User",
  listing: "Listing",
};
