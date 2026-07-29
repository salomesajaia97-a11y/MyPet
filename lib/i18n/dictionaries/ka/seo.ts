/**
 * Search-facing copy: the <title> and meta description for every indexable
 * section page. Kept apart from `pages` (legal/static copy) because these
 * strings are tuned for SERP snippets, not for on-page reading.
 *
 * Titles are rendered through the root template ("%s · MyPetge.online"), so they
 * must stay short enough that the brand suffix still fits in ~60 characters.
 */
export const seo = {
  buySell: {
    title: "ცხოველების ყიდვა-გაყიდვა",
    description:
      "ძაღლების და კატების ყიდვა-გაყიდვა საქართველოში — ჯიშის ლეკვები, კნუტები და სხვა შინაური ცხოველები. ფასები, ფოტოები და პირდაპირი კონტაქტი მფლობელთან.",
  },
  adoption: {
    title: "ცხოველების გაჩუქება უფასოდ",
    description:
      "ძაღლების და კატების გაჩუქება უფასოდ — გასაშვილებელი ლეკვები და კნუტები მთელი საქართველოდან. იპოვე ოთხფეხა მეგობარი და აიყვანე სახლში.",
  },
  mating: {
    title: "ძაღლების და კატების შეჯვარება",
    description:
      "შესაჯვარებელი ძაღლები და კატები — შეჯვარება და დაწყვილება ჯიშის მიხედვით, თბილისსა და საქართველოს სხვა ქალაქებში.",
  },
  lostFound: {
    title: "დაკარგული და ნაპოვნი ცხოველები",
    description:
      "დაკარგული ძაღლები და კატები, ნაპოვნი ცხოველები — განათავსე განცხადება უფასოდ და იპოვე შენი ოთხფეხა მეგობარი.",
  },
  lostFoundMatch: {
    title: "დაკარგულის ძებნა ფოტოთი",
    description:
      "ატვირთე ფოტო და ხელოვნური ინტელექტი შეადარებს დაკარგული და ნაპოვნი ცხოველების განცხადებებს.",
  },
  services: {
    title: "ცხოველების სერვისები",
    description:
      "ვეტკლინიკები, ცხოველების სასტუმროები, პეტ მაღაზიები, გრუმინგი და pet-friendly ადგილები თბილისსა და მთელ საქართველოში.",
  },
  vetClinics: {
    title: "ვეტკლინიკები და ვეტერინარები",
    description:
      "ვეტკლინიკა თბილისში და საქართველოს სხვა ქალაქებში — ვეტერინარული კლინიკები, 24-საათიანი მომსახურება, მისამართები, ტელეფონები და შეფასებები.",
  },
  petHotels: {
    title: "ცხოველების სასტუმროები",
    description:
      "ძაღლების და კატების სასტუმროები — მინდობით მოვლა სამოგზაუროდ, ფასი ღამეში, მისამართები და მომხმარებელთა შეფასებები.",
  },
  petShops: {
    title: "პეტ მაღაზიები და გრუმინგი",
    description:
      "ცხოველების მაღაზიები, საკვები, აქსესუარები და გრუმინგი თბილისში — მისამართები, სამუშაო საათები და კონტაქტი.",
  },
  petFriendly: {
    title: "Pet-Friendly ადგილები",
    description:
      "კაფეები, სასტუმროები და პარკები, სადაც ცხოველი მისასალმებელია — რუკა და ფილტრები თბილისსა და მთელ საქართველოში.",
  },
  vip: {
    title: "VIP განცხადებები და ფასები",
    description:
      "გაზარდე შენი განცხადების ხილვადობა MyPetge.online-ზე — VIP პაკეტები, ფასები, ვადები და დაბრუნების პირობები.",
  },
  /** Appended to the title on page 2+ of a browse route. */
  pageWord: "გვერდი",
  breadcrumbs: {
    home: "მთავარი",
    listings: "განცხადებები",
  },
};
