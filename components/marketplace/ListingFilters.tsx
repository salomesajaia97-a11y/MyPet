"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import type { MarketplaceType } from "@/types/marketplace";

interface Props {
  type: MarketplaceType;
}

const speciesOptions = ["dog", "cat", "bird", "rabbit", "reptile", "other"];

export function ListingFilters({ type }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value && value !== "all") {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.delete("page");
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  const clearAll = () => router.push(pathname);

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5 sticky top-24">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Filters</h3>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Species</label>
        <Select value={params.get("species") ?? "all"} onValueChange={(v) => updateParam("species", v)}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="All species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All species</SelectItem>
            {speciesOptions.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</label>
        <Input
          placeholder="Neighborhood or city"
          defaultValue={params.get("location") ?? ""}
          onChange={(e) => updateParam("location", e.target.value)}
          className="bg-background"
        />
      </div>

      {type === "buy-sell" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max Price (₾)</label>
            <Input
              type="number"
              placeholder="e.g. 500"
              defaultValue={params.get("maxPrice") ?? ""}
              onChange={(e) => updateParam("maxPrice", e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pedigree</label>
            <Select value={params.get("pedigree") ?? "all"} onValueChange={(v) => updateParam("pedigree", v)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="FCI">FCI</SelectItem>
                <SelectItem value="FCG">FCG</SelectItem>
                <SelectItem value="none">No pedigree</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {(params.size > 0) && (
        <Button variant="outline" size="sm" className="w-full" onClick={clearAll}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
