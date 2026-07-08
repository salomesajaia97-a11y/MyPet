export const admin = {
  dashboard: {
    title: "დაფა",
    stats: {
      listings: "განცხადებები",
      businesses: "ბიზნესები",
      pending: "მოლოდინში",
      users: "მომხმარებლები",
      uploads: "ატვირთვები",
    },
    chartByType: "განცხადებები ტიპის მიხედვით",
    chartByCategory: "ბიზნესები კატეგორიის მიხედვით",
    recentListings: "ბოლო განცხადებები",
    pendingBusinesses: "მოლოდინში მყოფი ბიზნესები",
    viewAll: "ყველა →",
    moderate: "მოდერაცია →",
    noPending: "მოლოდინში მყოფი განაცხადები არ არის.",
  },
  // Marketplace listing type labels (map DB `type` → display).
  listingTypes: {
    buySell: "ყიდვა-გაყიდვა",
    adoption: "გაჩუქება",
    mating: "შეჯვარება",
    lostFound: "დაკარგული/ნაპოვნი",
  },
  // Business category labels — plural form used on the dashboard chart.
  dashboardCategories: {
    vetClinics: "ვეტ-კლინიკები",
    petHotels: "სასტუმროები",
    petShops: "მაღაზიები",
    petFriendly: "Pet-Friendly",
  },
  businesses: {
    title: "მოლოდინში მყოფი ბიზნესები",
    subtitle:
      "მომხმარებლის მიერ გამოგზავნილი სერვისები განხილვის მოლოდინში. დაამტკიცე გამოსაქვეყნებლად, უარყავი წასაშლელად.",
    loading: "იტვირთება…",
    noPending: "მოლოდინში მყოფი განაცხადები არ არის.",
    approve: "დამტკიცება",
    reject: "უარყოფა",
    rejectConfirm: "უარვყო და წავშალო ეს განაცხადი? ეს შეუქცევადია.",
    // Business category labels — singular form used on the moderation list.
    categories: {
      vetClinic: "ვეტ-კლინიკა",
      petHotel: "სასტუმრო",
      petShop: "მაღაზია",
      petFriendly: "Pet-Friendly",
    },
  },
  listings: {
    title: "განცხადებები",
    subtitle:
      "ყველა განცხადება. რედაქტირება, წაშლა, VIP-ად მონიშვნა, მოგვარებულად მონიშვნა.",
    allTypes: "ყველა ტიპი",
    searchPlaceholder: "ძებნა ჯიშით…",
    search: "ძებნა",
    deleteConfirm: "წავშალო ეს განცხადება? შეუქცევადია.",
    resolved: "მოგვარებული",
    loading: "იტვირთება…",
    empty: "განცხადებები არ არის.",
    cols: {
      photo: "ფოტო",
      type: "ტიპი",
      breed: "ჯიში",
      price: "ფასი",
      owner: "მფლობელი",
      actions: "მოქმედებები",
    },
    actions: {
      edit: "რედაქტირება",
      grantVip: "VIP-ის მინიჭება",
      removeVip: "VIP-ის მოხსნა",
      markResolved: "მოგვარებულად მონიშვნა",
      markUnresolved: "მოუგვარებლად მონიშვნა",
      delete: "წაშლა",
    },
  },
  users: {
    title: "მომხმარებლები",
    loading: "იტვირთება…",
    deleteConfirm: "წავშალო ეს მომხმარებელი? ეს შეუქცევადია.",
    empty: "მომხმარებლები ვერ მოიძებნა.",
    cols: {
      name: "სახელი",
      email: "ელფოსტა",
      role: "როლი",
      joined: "შემოუერთდა",
    },
  },
  uploads: {
    title: "ატვირთვები",
    loading: "იტვირთება…",
    empty: "ატვირთვები ჯერ არ არის.",
    deleteConfirm: "წავშალო ეს სურათი Cloudinary-დან? ეს შეუქცევადია.",
  },
  chart: {
    total: "სულ",
  },
};
