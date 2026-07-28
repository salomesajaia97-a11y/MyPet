export const vip = {
  // Pricing page
  pageTitle: "VIP packages",
  pageSubtitle: "Get your listing seen by more people",
  perDays: "days",
  gel: "GEL",
  choose: "Choose",
  tiers: {
    standard: {
      name: "Standard VIP",
      desc: "Highlights the listing and places it in the VIP section for 3 days.",
    },
    super: {
      name: "Super VIP",
      desc: "Premium placement at the top of search results and the homepage for 7 days.",
    },
    ultra: {
      name: "Ultra VIP / TOP",
      desc: "Maximum visibility across the platform with a priority badge for 14 days.",
    },
  },
  badge: { standard: "VIP", super: "SUPER", ultra: "TOP" },
  terms:
    "All payments are one-time charges for digital promotional services. There is no recurring subscription. When the period ends the listing stays on the platform as a normal listing.",
  refund:
    "A promotion that has already started is non-refundable. If the service did not activate after payment, contact us.",
  termsLink: "Terms and conditions",

  // Promote dialog
  dialog: {
    title: "Promote this listing",
    subtitle: "Pick a package",
    pay: "Pay",
    redirecting: "Redirecting…",
    paymentsOff: "Card payments are paused right now. Please try again later.",
    cancel: "Cancel",
    error: "Could not start the payment. Please try again.",
    loginRequired: "Sign in to pay",
  },

  // Result page
  result: {
    pendingTitle: "Processing payment",
    pendingBody: "Please wait, this takes a few seconds.",
    slowTitle: "Still processing",
    slowBody:
      "The bank has not confirmed yet. Your promotion activates on its own as soon as it does — there is no need to pay again.",
    successTitle: "Payment successful",
    successBody: "Your listing has been promoted.",
    activeUntil: "VIP active until",
    declinedTitle: "Payment declined",
    declinedBody: "You were not charged. Try a different card.",
    errorTitle: "Could not confirm status",
    errorBody: "If you were charged, the promotion will activate automatically.",
    viewListing: "View listing",
    backToListing: "Back to listing",
  },

  // Upsell after creating a listing
  upsell: {
    title: "Listing published",
    body: "Want more views? Promote it now.",
    skip: "Not now",
  },

  // Payment history
  payments: {
    title: "Payments",
    empty: "No payments yet",
    date: "Date",
    user: "User",
    listing: "Listing",
    package: "Package",
    amount: "Amount",
    status: "Status",
    all: "All",
    statuses: {
      created: "Started",
      processing: "Processing",
      approved: "Paid",
      declined: "Declined",
      expired: "Expired",
      reversed: "Refunded",
    },
  },
};
