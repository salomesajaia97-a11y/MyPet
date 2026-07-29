import type { pages as ka } from "../ka/pages";

export const pages: typeof ka = {
  about: {
    metaDescription:
      "MyPetge.online — buying, adopting, and services for pets, all in one place.",
    title: "About Us",
    subtitle: "Buying, adopting, and services for pets — all in one place.",
    paragraphs: [
      "MyPetge.online is Georgia's pet platform, where buying and selling, adoption, mating, lost-and-found listings, as well as vet clinics, hotels, and other services all come together in one space.",
      "Our mission is to help owners find their four-legged friend and receive the best service easily, quickly, and safely.",
      "The platform is constantly evolving — we add new services and features so that every animal stays protected and well cared for.",
    ],
  },
  contact: {
    metaDescription: "Get in touch — the MyPetge.online team is ready to help you.",
    title: "Contact",
    subtitle: "Have a question or a suggestion? Send us an email.",
    faqHint: "Many questions are already answered here:",
  },
  faq: {
    metaDescription:
      "How to post a listing, what it costs, how VIP promotion works and how the lost-pet photo search works — answers to common questions about MyPetge.online.",
    title: "Frequently Asked Questions",
    subtitle: "Short answers on how MyPetge.online works.",
    moreHelp: "Didn't find your answer?",
    items: [
      {
        q: "Does posting a listing cost anything?",
        a: "No. Posting a pet for sale, for free adoption, for mating, or as lost and found is free on MyPetge.online. Only VIP promotion is paid, and it is entirely optional.",
      },
      {
        q: "How do I post a listing?",
        a: "Register or sign in with Google, then press \"Add listing\", pick a category and fill in photos, breed, age, city, price and a contact number. The listing goes live immediately.",
      },
      {
        q: "What is a VIP listing and what does it do?",
        a: "A VIP listing sits at the top of its section and carries a badge, so it gets seen and called about far more. Packages come in several durations; the prices are on the VIP page and payment is by card.",
      },
      {
        q: "How do I contact a seller or owner?",
        a: "Each listing shows the owner's phone number, and you can also message them from the site — the conversation is kept under \"Messages\" in your profile.",
      },
      {
        q: "How do I adopt a pet for free?",
        a: "Open the Adoption section: it collects dogs, cats and other pets being given away free across Georgia. Listings often state temperament, vaccination and whether the animal is spayed or neutered.",
      },
      {
        q: "I lost my pet — what should I do?",
        a: "Post in the Lost & Found section with the neighbourhood, the date and a photo. Then use the photo search: an AI model compares your picture against every open listing and shows you the closest matches.",
      },
      {
        q: "How do I find a vet clinic, a pet hotel or a pet shop?",
        a: "The Services directory covers vet clinics, pet hotels, pet shops, grooming and pet-friendly venues — with addresses, phone numbers, reviews and a map.",
      },
      {
        q: "How do I add my own business to the directory?",
        a: "Choose to add a business from the Services page and fill in the details. Submissions go through moderation and are published once approved — you get a notification in your profile.",
      },
      {
        q: "How do I avoid being scammed?",
        a: "Meet in person and see the animal before paying, never send money up front to someone you don't know, ask for the vaccination card or passport, and tell us if something looks wrong — listings that break the rules are removed.",
      },
      {
        q: "Which cities in Georgia does MyPetge.online cover?",
        a: "The whole country. Most listings are in Tbilisi, followed by Batumi, Kutaisi, Rustavi, Gori and Zugdidi, and you can filter by city when searching.",
      },
      {
        q: "Is the site available in English?",
        a: "Yes — the KA｜EN switch in the top navigation translates the whole interface. Listing text is written by the people who post it, so it stays in whatever language they used.",
      },
    ],
  },
  terms: {
    metaDescription: "MyPetge.online's terms and conditions of service.",
    title: "Terms & Conditions",
    lastUpdated: "Last updated: 2026",
    sections: [
      {
        title: "1. General Provisions",
        body: "By using MyPetge.online you agree to these terms and conditions. If you do not agree, please do not use the platform.",
      },
      {
        title: "2. User Obligations",
        body: "Users are obligated to post accurate and truthful information. Posting false, misleading, or unlawful content is prohibited.",
      },
      {
        title: "3. Listings",
        body: "The platform reserves the right to remove or suspend any listing that violates these rules or the legislation of Georgia.",
      },
      {
        title: "4. Liability",
        body: "MyPetge.online is a platform for posting listings and is not a party to the transactions concluded between users.",
      },
      {
        title: "5. Changes",
        body: "These terms and conditions may be updated periodically. The updated version takes effect as soon as it is published on the platform.",
      },
    ],
  },
  privacy: {
    metaDescription: "MyPetge.online's privacy policy.",
    title: "Privacy",
    lastUpdated: "Last updated: 2026",
    sections: [
      {
        title: "1. What Data We Collect",
        body: "We collect the information you provide — your name, contact details, and the content of your listings, as well as technical data about your use of the platform.",
      },
      {
        title: "2. How We Use Data",
        body: "Data is used to deliver the service, publish listings, enable communication between users, and improve the platform.",
      },
      {
        title: "3. Data Sharing",
        body: "We do not sell your personal data. Information is shared with third parties only in cases provided for by law.",
      },
      {
        title: "4. Data Protection",
        body: "We use technical and organizational measures to protect your data from unauthorized access and loss.",
      },
      {
        title: "5. Your Rights",
        body: "You have the right to request access to, correction of, or deletion of your data. Contact us through the channels listed on the “Contact” page.",
      },
    ],
  },
};
