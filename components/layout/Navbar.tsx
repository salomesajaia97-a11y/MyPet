import Link from "next/link";
import { ModuleToggle } from "./ModuleToggle";
import { Button } from "@/components/ui/button";
import { PawPrint } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <PawPrint className="w-6 h-6 text-primary" />
          <span className="font-semibold text-lg tracking-tight">MyPet</span>
        </Link>

        <ModuleToggle />

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Post Ad</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
