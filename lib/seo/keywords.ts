/**
 * Keyword corpus for MyPet.ge (mypetge.online).
 *
 * Georgian users type the same query four different ways: in Mkhedruli, in
 * ad-hoc Latin transliteration (`dzaglebis yidva`), with the common typos of
 * that transliteration (`zaglebis yidva`, `veklat`), and in Russian. All four
 * are kept side by side so a single group covers every spelling of one intent.
 *
 * Groups are composed per page with `buildKeywords()` — the root layout gets
 * the broad set, each section page gets its own intent plus the brand terms.
 */

/** Brand / navigational queries — people looking for the site by name. */
export const BRAND_KEYWORDS = [
  "mypet",
  "mypet ge",
  "mypetge",
  "mypet.ge",
  "my pet ge",
  "mypetge online",
  "mypetge.online",
  "mypet georgia",
  "mypet საქართველო",
  "მაიფეთი",
  "მაი ფეთი",
  "მაიფეთ ჯი",
  "მაიპეტი",
];

/** Broad "pets in Georgia" head terms. */
export const GENERAL_KEYWORDS = [
  "შინაური ცხოველები",
  "ცხოველების განცხადებები",
  "ცხოველების განცხადება",
  "ცხოველების პორტალი",
  "ცხოველების საიტი",
  "ცხოველების ბაზარი",
  "ცხოველთა პლატფორმა",
  "ცხოველების ყიდვა გაყიდვა",
  "ცხოველის ყიდვა",
  "ძაღლის ყიდვა",
  "ცხოველები საქართველოში",
  "ცხოველები თბილისში",
  "ცხოველების განცხადებების საიტი",
  // Transliterations
  "shinauri cxovelebi",
  "shinauri tskhovelebi",
  "cxovelebis gancxadebebi",
  "cxovelebis portali",
  "cxovelebis saiti",
  "cxovelebis yidva gayidva",
  "cxovelis yidva",
  "dzaglis yidva",
  "cxovelebi tbilisshi",
  // Frequent misspellings of the transliteration
  "tskhovelebis gancxadebebi",
  "cxovelebis qidva",
  "dzaglis qidva",
];

/** Buy & sell intent. */
export const BUY_SELL_KEYWORDS = [
  "ძაღლების ყიდვა გაყიდვა",
  "კატების ყიდვა გაყიდვა",
  "ძაღლების გაყიდვა",
  "კატის ყიდვა",
  "ლეკვები",
  "ლეკვების ყიდვა",
  "ლეკვები იყიდება",
  "კნუტები",
  "კნუტების ყიდვა",
  "კნუტები იყიდება",
  "ძაღლი იყიდება",
  "კატა იყიდება",
  "ჯიშის ძაღლები",
  "ჯიშიანი ძაღლები",
  "ჯიშის კატები",
  "ცხოველების ყიდვა თბილისში",
  "ძაღლების ყიდვა თბილისში",
  // Transliterations
  "dzaglebis yidva gayidva",
  "dzaglebis yidva",
  "katebis yidva gayidva",
  "katis yidva",
  "lekvebi",
  "lekvebis yidva",
  "lekvebi iyideba",
  "knutebi",
  "knutebis yidva",
  "dzagli iyideba",
  "kata iyideba",
  "jishis dzaglebi",
  // Misspellings
  "zaglebis yidva",
  "dzaghlebis yidva",
  "dzaglebis qidva",
  "jishis zaglebi",
  "leknebi",
];

/** Adoption / giveaway intent — high-volume and almost always "free". */
export const ADOPTION_KEYWORDS = [
  "ძაღლების გაჩუქება",
  "ძაღლის გაჩუქება",
  "კატების გაჩუქება უფასოდ",
  "კატის გაჩუქება",
  "ცხოველების ჩუქება",
  "ცხოველების გაჩუქება",
  "ლეკვის აყვანა",
  "ლეკვების გაჩუქება",
  "კნუტების გაჩუქება",
  "გასაშვილებელი ძაღლები",
  "გასაშვილებელი კატები",
  "ცხოველების გაშვილება",
  "უფასო ცხოველები",
  "ძაღლის აყვანა",
  "კატის აყვანა",
  "ძაღლების გაჩუქება თბილისში",
  // Transliterations
  "dzaglebis gachukeba",
  "dzaglis gachukeba",
  "katebis gachukeba ufasod",
  "katis gachukeba",
  "cxovelebis chukeba",
  "lekvis ayvana",
  "gasashvilebeli dzaglebi",
  "gasashvilebeli katebi",
  // Misspellings
  "dzaglebis gachuqeba",
  "katebis gachuqeba",
  "zaglebis gachukeba",
  "gachukeba dzagli",
];

/** Mating / stud intent. */
export const MATING_KEYWORDS = [
  "ძაღლების შეჯვარება",
  "ძაღლის შეჯვარება",
  "კატების შეჯვარება",
  "კატის შეჯვარება",
  "ცხოველების შეჯვარება",
  "დაწყვილება",
  "შესაჯვარებელი ძაღლი",
  "შესაჯვარებელი კატა",
  "შეჯვარება თბილისში",
  // Transliterations
  "dzaglebis shejvareba",
  "katebis shejvareba",
  "shejvareba",
  "dawyvileba",
  "shesajvarebeli dzagli",
  // Misspellings
  "sejvareba",
  "datsyvileba",
  "dzaglebis sejvareba",
];

/** Lost & found intent — urgent, local, heavily searched at night. */
export const LOST_FOUND_KEYWORDS = [
  "დაკარგული ძაღლები",
  "დაკარგული ძაღლი",
  "ნაპოვნი ძაღლები",
  "ნაპოვნი ძაღლი",
  "დაკარგული კატა",
  "ნაპოვნი კატა",
  "დაკარგული ცხოველები",
  "ნაპოვნი ცხოველები",
  "დაკარგული ცხოველების განცხადება",
  "დაკარგული ცხოველების განცადება",
  "დაიკარგა ძაღლი",
  "დაიკარგა კატა",
  "ვეძებ ძაღლს",
  "დაკარგული ძაღლი თბილისში",
  // Transliterations
  "dakarguli dzaglebi",
  "dakarguli dzagli",
  "napovni dzaglebi",
  "dakarguli kata",
  "napovni kata",
  "dakarguli cxovelebi",
  "daikarga dzagli",
  "vezeb dzagls",
  // Misspellings
  "dakarguli zagli",
  "napovni zagli",
  "dakarguli cxovelebis gancadeba",
];

/** Vet clinics. */
export const VET_KEYWORDS = [
  "ვეტკლინიკა",
  "ვეტკლინიკა თბილისში",
  "ვეტკლინიკა თბლისში",
  "ვეტერინარული კლინიკა",
  "ვეტერინარი თბილისში",
  "ვეტექიმი",
  "ცხოველთა ექიმი",
  "ვეტაფთიაქი",
  "ვეტკლინიკა 24 საათი",
  "გადაუდებელი ვეტდახმარება",
  "ცხოველების ვაქცინაცია",
  "ცხოველის სტერილიზაცია",
  // Transliterations
  "vetklinika",
  "vetklinika tbilisshi",
  "veterinaruli klinika",
  "veterinari tbilisshi",
  "veteqimi",
  "vetaptiaqi",
  // Misspellings
  "veklat",
  "vetklinka",
  "vetkilinika",
  "vet klinika",
  "veterinari tbilisi",
];

/** Pet hotels / boarding. */
export const HOTEL_KEYWORDS = [
  "ცხოველების სასტუმროები",
  "ცხოველების სასტუმრო",
  "ძაღლების სასტუმრო",
  "კატების სასტუმრო",
  "ცხოველების სასტუმრო თბილისში",
  "ცხოველის მინდობით მოვლა",
  "ძაღლის დატოვება",
  // Transliterations
  "cxovelebis sastumro",
  "dzaglebis sastumro",
  "katebis sastumro",
  "cxovelebis sastumroebi",
  // Misspellings
  "cxovelebis sastumroeb",
  "zaglebis sastumro",
];

/** Pet shops, grooming and other care services. */
export const CARE_KEYWORDS = [
  "გრუმინგი",
  "ძაღლების გრუმინგი",
  "კატების გრუმინგი",
  "ცხოველების მაღაზია",
  "პეტ შოპი",
  "ძაღლის საკვები",
  "კატის საკვები",
  "ცხოველების აქსესუარები",
  "ცხოველების მოვლა",
  "ძაღლის ვარცხნა",
  "ცხოველების ტრანსპორტირება",
  // Transliterations
  "grumingi",
  "gruming",
  "dzaglebis grumingi",
  "pet shopi",
  "cxovelebis magazia",
  "dzaglis sakvebi",
  // Misspellings
  "gruminigi",
  "grooming tbilisi",
];

/** Pet-friendly venues. */
export const PET_FRIENDLY_KEYWORDS = [
  "petfriendly ადგილები",
  "pet friendly ადგილები",
  "პეტ ფრენდლი",
  "ცხოველებთან ერთად კაფე",
  "ძაღლთან ერთად კაფე",
  "petfriendly კაფე თბილისი",
  "ცხოველებით სასტუმრო",
  "petfriendly პარკი",
  // Transliterations
  "petfriendly adgilebi",
  "pet friendly adgilebi tbilisshi",
  "pet frendli",
];

/** Popular breeds — long-tail, converts well on listing pages. */
export const BREED_KEYWORDS = [
  "გერმანული ნაგაზი",
  "ფრანგული ბულდოგი",
  "პომერანული შპიცი",
  "ბრიტანული კნუტები",
  "ლაბრადორი",
  "ჰასკი",
  "ჩიხუახუა",
  "იორკშირის ტერიერი",
  "შიჰ ცუ",
  "როტვეილერი",
  "კავკასიური ნაგაზი",
  "ალაბაი",
  "დობერმანი",
  "პუდელი",
  "ბიგლი",
  "კორგი",
  "სამოიედი",
  "აკიტა ინუ",
  "პიტბული",
  "სფინქსი",
  "სკოტიშ ფოლდი",
  "მეინ კუნი",
  "სპარსული კატა",
  "ბენგალური კატა",
  // Transliterations
  "germanuli nagazi",
  "franguli buldogi",
  "pomeranuli shpici",
  "britanuli knutebi",
  "labradori",
  "haski",
  "chixuaxua",
  "iorkshiris terieri",
  "kavkasiuri nagazi",
  "sfinqsi",
  "mein kuni",
  // Misspellings
  "germanuli nagaz",
  "franguli buldog",
  "pomeranuli spici",
  "britanuli knuti",
];

/** English queries — expats and tourists in Tbilisi/Batumi. */
export const ENGLISH_KEYWORDS = [
  "pets Georgia",
  "pet marketplace Georgia",
  "pet classifieds Tbilisi",
  "buy dog Tbilisi",
  "buy cat Tbilisi",
  "puppies for sale Tbilisi",
  "kittens for sale Georgia",
  "adopt a dog Georgia",
  "adopt a cat Tbilisi",
  "free puppies Tbilisi",
  "dog mating Georgia",
  "lost dog Tbilisi",
  "found cat Tbilisi",
  "vet clinic Tbilisi",
  "veterinary clinic Georgia",
  "24 hour vet Tbilisi",
  "pet hotel Tbilisi",
  "pet boarding Tbilisi",
  "pet shop Tbilisi",
  "pet grooming Tbilisi",
  "pet friendly places Tbilisi",
];

/** Russian queries — still a large share of search in Tbilisi. */
export const RUSSIAN_KEYWORDS = [
  "купить собаку Тбилиси",
  "купить кошку Грузия",
  "отдам щенка Тбилиси",
  "отдам котенка в добрые руки Тбилиси",
  "вязка собак Тбилиси",
  "потерялась собака Тбилиси",
  "найдена кошка Тбилиси",
  "ветклиника Тбилиси",
  "гостиница для животных Тбилиси",
  "груминг Тбилиси",
  "зоомагазин Тбилиси",
];

/** Cities we serve — appended to section keywords for local intent. */
export const CITY_KEYWORDS = [
  "თბილისი",
  "ბათუმი",
  "ქუთაისი",
  "რუსთავი",
  "გორი",
  "ზუგდიდი",
  "Tbilisi",
  "Batumi",
  "Kutaisi",
];

/** Merge keyword groups, trim, drop duplicates (case-insensitive) and blanks. */
export function buildKeywords(...groups: (readonly string[] | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const group of groups) {
    for (const raw of group ?? []) {
      const value = raw.trim();
      if (!value) continue;
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(value);
    }
  }
  return out;
}

/**
 * Site-wide set for the root layout: brand + head terms + a slice of every
 * intent, so the homepage competes for the broad queries while section pages
 * carry the deep long tail.
 */
export const SITE_KEYWORDS = buildKeywords(
  BRAND_KEYWORDS,
  GENERAL_KEYWORDS,
  BUY_SELL_KEYWORDS.slice(0, 14),
  ADOPTION_KEYWORDS.slice(0, 12),
  MATING_KEYWORDS.slice(0, 6),
  LOST_FOUND_KEYWORDS.slice(0, 10),
  VET_KEYWORDS.slice(0, 10),
  HOTEL_KEYWORDS.slice(0, 6),
  CARE_KEYWORDS.slice(0, 6),
  PET_FRIENDLY_KEYWORDS.slice(0, 6),
  BREED_KEYWORDS.slice(0, 8),
  ENGLISH_KEYWORDS.slice(0, 12),
  RUSSIAN_KEYWORDS.slice(0, 6),
);
