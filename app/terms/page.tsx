import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "წესები და პირობები — MyPet.ge",
  description: "MyPet.ge-ის მომსახურების წესები და პირობები.",
};

const SECTIONS = [
  {
    title: "1. ზოგადი დებულებები",
    body: "MyPet.ge-ით სარგებლობით თქვენ ეთანხმებით წინამდებარე წესებსა და პირობებს. თუ არ ეთანხმებით, გთხოვთ, არ ისარგებლოთ პლატფორმით.",
  },
  {
    title: "2. მომხმარებლის ვალდებულებები",
    body: "მომხმარებელი ვალდებულია განათავსოს ზუსტი და უტყუარი ინფორმაცია. აკრძალულია ყალბი, შეცდომაში შემყვანი ან უკანონო შინაარსის განთავსება.",
  },
  {
    title: "3. განცხადებები",
    body: "პლატფორმა უფლებას იტოვებს წაშალოს ან შეაჩეროს განცხადება, რომელიც არღვევს წესებს ან საქართველოს კანონმდებლობას.",
  },
  {
    title: "4. პასუხისმგებლობა",
    body: "MyPet.ge წარმოადგენს განცხადებების განთავსების პლატფორმას და არ არის მხარე მომხმარებლებს შორის დადებულ გარიგებებში.",
  },
  {
    title: "5. ცვლილებები",
    body: "წესები და პირობები შესაძლოა პერიოდულად განახლდეს. განახლებული ვერსია ძალაში შედის პლატფორმაზე გამოქვეყნებისთანავე.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-black text-[#0F2830] mb-2">
          წესები და პირობები
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
