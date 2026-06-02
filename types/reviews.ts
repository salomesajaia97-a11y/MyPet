export type ReviewSource = "google" | "native";

export interface Review {
  _id: string;
  businessId: string;
  source: ReviewSource;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;     // 1-5
  text: string;
  date: string;
  // google-specific
  googleReviewId?: string;
  googleProfileUrl?: string;
}

export interface ReviewFormData {
  rating: number;
  text: string;
  reviewerName: string;
}
