"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const modules = [
  { label: "Pet Marketplace", href: "/", georgian: "პეთ მარკეტი" },
  { label: "Services Directory", href: "/services", georgian: "სერვისები" },
];

export function ModuleToggle() {
  const path = usePathname();
  const isServices = path.startsWith("/services");

  return (
    <div className="flex gap-1 bg-muted rounded-lg p-1">
      {modules.map((m) => {
        const active = m.href === "/services" ? isServices : !isServices;
        return (
          <Link
            key={m.href}
            href={m.href}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
              active
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="hidden sm:inline">{m.label}</span>
            <span className="sm:hidden">{m.georgian}</span>
          </Link>
        );
      })}
    </div>
  );
}
