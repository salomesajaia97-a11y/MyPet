"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import type { ServiceCategory } from "@/types/services";

interface Props { category: ServiceCategory; }

export function ServiceFilters({ category }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      value && value !== "all" ? next.set(key, value) : next.delete(key);
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5 sticky top-24">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Filters</h3>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Min Rating</label>
        <Select value={params.get("minRating") ?? "all"} onValueChange={(v) => updateParam("minRating", v)}>
          <SelectTrigger className="bg-background"><SelectValue placeholder="Any rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any rating</SelectItem>
            {["4.5", "4", "3.5", "3"].map((r) => (
              <SelectItem key={r} value={r}>⭐ {r}+</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {category === "vet-clinics" && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Availability</label>
          <button
            className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
              params.get("is24h") === "true" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"
            }`}
            onClick={() => updateParam("is24h", params.get("is24h") === "true" ? "" : "true")}
          >
            24/7 Available
          </button>
          <button
            className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
              params.get("emergency") === "true" ? "border-red-500 bg-red-50 text-red-700" : "border-border hover:border-red-200"
            }`}
            onClick={() => updateParam("emergency", params.get("emergency") === "true" ? "" : "true")}
          >
            Emergency Services
          </button>
        </div>
      )}

      {category === "pet-friendly" && (
        <button
          className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
            params.get("indoorAllowed") === "true" ? "border-primary bg-primary/5 text-primary" : "border-border"
          }`}
          onClick={() => updateParam("indoorAllowed", params.get("indoorAllowed") === "true" ? "" : "true")}
        >
          Indoor Allowed
        </button>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Neighborhood</label>
        <Input placeholder="e.g. Vake, Saburtalo" defaultValue={params.get("neighborhood") ?? ""}
          onChange={(e) => updateParam("neighborhood", e.target.value)} className="bg-background" />
      </div>

      {params.size > 0 && (
        <Button variant="outline" size="sm" className="w-full" onClick={() => router.push(pathname)}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
