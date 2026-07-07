import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ჩვენს შესახებ — MyPet.ge",
  description: "MyPet.ge — ცხოველების ყიდვა, გაჩუქება და სერვისები ერთ სივრცეში.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-black text-[#0F2830] mb-2">
          ჩვენს შესახებ
        </h1>
        <p className="text-stone-500 text-sm mb-8">
          ცხოველების ყიდვა, გაჩუქება და სერვისები — ერთ სივრცეში.
        </p>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-5 text-stone-600 leading-relaxed">
          <p>
            MyPet.ge არის საქართველოს ცხოველების პლატფორმა, სადაც ერთ
            სივრცეში იყრის თავს ყიდვა-გაყიდვა, გაჩუქება, შეჯვარება, დაკარგული
            და ნაპოვნი ცხოველების განცხადებები, ასევე ვეტ-კლინიკები,
            სასტუმროები და სხვა სერვისები.
          </p>
          <p>
            ჩვენი მიზანია, დავეხმაროთ მფლობელებს იპოვონ თავიანთი ოთხფეხა
            მეგობარი და მიიღონ საუკეთესო მომსახურება მარტივად, სწრაფად და
            უსაფრთხოდ.
          </p>
          <p>
            პლატფორმა მუდმივად ვითარდება — ვამატებთ ახალ სერვისებსა და
            ფუნქციებს, რომ თითოეული ცხოველი დაცული და მოვლილი იყოს.
          </p>
        </div>
      </div>
    </div>
  );
}
