import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "კონფიდენციალურობა — MyPet.ge",
  description: "MyPet.ge-ის კონფიდენციალურობის პოლიტიკა.",
};

const SECTIONS = [
  {
    title: "1. რა მონაცემებს ვაგროვებთ",
    body: "ვაგროვებთ თქვენ მიერ მოწოდებულ ინფორმაციას — სახელს, საკონტაქტო მონაცემებსა და განცხადებების შინაარსს, ასევე პლატფორმით სარგებლობის ტექნიკურ მონაცემებს.",
  },
  {
    title: "2. როგორ ვიყენებთ მონაცემებს",
    body: "მონაცემები გამოიყენება სერვისის მიწოდების, განცხადებების გამოქვეყნების, მომხმარებლებს შორის კომუნიკაციისა და პლატფორმის გაუმჯობესებისთვის.",
  },
  {
    title: "3. მონაცემთა გაზიარება",
    body: "ჩვენ არ ვყიდით თქვენს პერსონალურ მონაცემებს. ინფორმაცია მესამე მხარეს გადაეცემა მხოლოდ კანონით გათვალისწინებულ შემთხვევებში.",
  },
  {
    title: "4. მონაცემთა დაცვა",
    body: "ვიყენებთ ტექნიკურ და ორგანიზაციულ ზომებს თქვენი მონაცემების უნებართვო წვდომისა და დაკარგვისგან დასაცავად.",
  },
  {
    title: "5. თქვენი უფლებები",
    body: "თქვენ გაქვთ უფლება მოითხოვოთ თქვენი მონაცემების წვდომა, შესწორება ან წაშლა. დაგვიკავშირდით გვერდზე „კონტაქტი“ მითითებული არხებით.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-black text-[#0F2830] mb-2">
          კონფიდენციალურობა
        </h1>
        <p className="text-stone-500 text-sm mb-8">
          ბოლო განახლება: 2026 წელი
        </p>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-bold text-[#0F2830] mb-1.5">
                {s.title}
              </h2>
              <p className="text-stone-600 leading-relaxed text-[15px]">
                {s.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
