import Link from "next/link";
import { Store, Briefcase, MapPin, Heart } from "lucide-react";

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#6B5240]/30 bg-white/60 text-sm text-[#6B5240] font-medium mb-8">
          <Heart className="w-3.5 h-3.5 fill-current" />
          საქართველოს #1 ფეთ პლატფორმა
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#6B5240] leading-tight mb-6 tracking-tight">
          ყველაფერი თქვენი<br />შინაური<br />ცხოველისთვის
        </h1>

        {/* Subtitle */}
        <p className="text-stone-600 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          იპოვეთ თქვენი იდეალური ცხოველი, მიიღეთ პროფესიონალური მომსახურება
          და შეუერთდით საქართველოს უდიდეს ფეთ-საზოგადოებას
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/buy-sell"
            className="inline-flex items-center gap-2 bg-[#6B5240] text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-[#5a4435] transition-colors"
          >
            <Store className="w-5 h-5" />
            განცხადებები
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 bg-[#6B5240] text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-[#5a4435] transition-colors"
          >
            <Briefcase className="w-5 h-5" />
            სერვისები
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: Store,
              title: "განცხადებები",
              desc: "ყიდვა, გაყიდვა, გაჩუქება, შეჯვარება",
              href: "/buy-sell",
            },
            {
              icon: Briefcase,
              title: "სერვისები",
              desc: "ვეტკლინიკები, სასტუმროები, მაღაზიები",
              href: "/services",
            },
            {
              icon: MapPin,
              title: "დაკარგული/ნაპოვნი",
              desc: "დაკარგული შინაური ცხოველების მოძიება",
              href: "/lost-found",
            },
          ].map((card) => (
            <Link key={card.href} href={card.href} className="group block">
              <div className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 h-full">
                <div className="w-12 h-12 rounded-xl bg-[#F5F0E8] flex items-center justify-center mb-4 group-hover:bg-[#6B5240]/10 transition-colors">
                  <card.icon className="w-6 h-6 text-[#6B5240]" />
                </div>
                <h3 className="font-bold text-[#1C1917] text-lg mb-2">{card.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="bg-[#4A3728] rounded-2xl px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-white">
            {[
              { number: "10,000+", label: "ცხოველის განცხადება" },
              { number: "500+", label: "ვერიფიცირებული სერვისი" },
              { number: "50,000+", label: "აქტიური მომხმარებელი" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl font-black mb-2">{stat.number}</p>
                <p className="text-white/70 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
