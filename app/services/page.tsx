import Link from "next/link";
import { Stethoscope, Home, ShoppingBag, Coffee } from "lucide-react";

const categories = [
  { href: "/services/vet-clinics", label: "Vet Clinics", georgian: "ვეტ. კლინიკები", icon: Stethoscope },
  { href: "/services/pet-hotels", label: "Pet Hotels", georgian: "ძაղლების სასტუმრო", icon: Home },
  { href: "/services/pet-shops", label: "Pet Shops", georgian: "Pet მაღაზიები", icon: ShoppingBag },
  { href: "/services/pet-friendly", label: "Pet-Friendly", georgian: "Pet-Friendly ადგილები", icon: Coffee },
];

export default function ServicesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Services Directory</h1>
        <p className="text-muted-foreground text-lg">Find trusted pet services in Georgia</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {categories.map((c) => (
          <Link key={c.href} href={c.href} className="group block">
            <div className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <c.icon className="w-10 h-10 mx-auto mb-4 text-primary" />
              <p className="font-bold text-lg">{c.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{c.georgian}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
