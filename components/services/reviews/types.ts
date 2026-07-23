export interface OwnerReply {
  text: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  _id: string;
  source: "google" | "native";
  userId?: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  text?: string;
  photos?: string[];
  helpfulCount?: number;
  votedByMe?: boolean;
  ownerReply?: OwnerReply;
  editedAt?: string;
  createdAt: string;
}

export interface ReviewDraft {
  rating: number;
  text: string;
  photos: string[];
}
