import Link from "next/link";
import { Users, ImageIcon, Store, ListChecks, Clock } from "lucide-react";
import { connectDB } from "@/lib/db";
import UserModel from "@/lib/models/User";
import UploadModel from "@/lib/models/Upload";
import BusinessModel from "@/lib/models/Business";
import ListingModel from "@/lib/models/Listing";
import { BarChart } from "@/components/admin/BarChart";

export const dynamic = "force-dynamic";

const LISTING_TYPE_LABEL: Record<string, string> = {
  "buy-sell": "ყიდვა-გაყიდვა",
  adoption: "გაჩუქება",
  mating: "შეჯვარება",
  "lost-found": "დაკარგული/ნაპოვნი",
};
const CATEGORY_LABEL: Record<string, string> = {
  "vet-clinics": "ვეტ-კლინიკები",
  "pet-hotels": "სასტუმროები",
  "pet-shops": "მაღაზიები",
  "pet-friendly": "Pet-Friendly",
};

function group(rows: { _id: string; count: number }[], labels: Record<string, string>) {
  return Object.keys(labels).map((key) => ({
    label: labels[key],
    value: rows.find((r) => r._id === key)?.count ?? 0,
  }));
}

export default async function AdminDashboard() {
  await connectDB();

  const [
    userCount,
    uploadCount,
    approvedBiz,
    pendingBiz,
    listingCount,
    listingsByType,
    bizByCategory,
    recentListings,
    recentPending,
  ] = await Promise.all([
    UserModel.countDocuments(),
    UploadModel.countDocuments(),
    BusinessModel.countDocuments({ status: "approved" }),
    BusinessModel.countDocuments({ status: "pending" }),
    ListingModel.countDocuments(),
    ListingModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]),
    BusinessModel.aggregate<{ _id: string; count: number }>([
      { $match: { status: "approved" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
    ListingModel.find().sort({ createdAt: -1 }).limit(5)
      .select("breed type createdAt").lean<{ _id: { toString(): string }; breed?: string; type?: string; createdAt: Date }[]>(),
    BusinessModel.find({ status: "pending" }).sort({ createdAt: -1 }).limit(5)
      .select("name category createdAt").lean<{ _id: { toString(): string }; name?: string; category?: string; createdAt: Date }[]>(),
  ]);

  const stats = [
    { icon: ListChecks, label: "Listings", value: listingCount, href: "/admin/listings" },
    { icon: Store, label: "Businesses", value: approvedBiz, href: "/admin/businesses" },
    { icon: Clock, label: "Pending", value: pendingBiz, href: "/admin/businesses", highlight: pendingBiz > 0 },
    { icon: Users, label: "Users", value: userCount, href: "/admin/users" },
    { icon: ImageIcon, label: "Uploads", value: uploadCount, href: "/admin/uploads" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="contents">
            <div
              className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow ${
                s.highlight ? "border-amber-300 ring-1 ring-amber-200" : "border-gray-200"
              }`}
            >
              <div className={`inline-flex rounded-lg p-2 mb-3 ${s.highlight ? "bg-amber-50" : "bg-gray-100"}`}>
                <s.icon size={18} className={s.highlight ? "text-amber-600" : "text-gray-600"} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChart title="Listings by type" data={group(listingsByType, LISTING_TYPE_LABEL)} />
        <BarChart title="Businesses by category" data={group(bizByCategory, CATEGORY_LABEL)} />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Recent listings</h2>
            <Link href="/admin/listings" className="text-xs text-[#0E4A5C] hover:underline">ყველა →</Link>
          </div>
          {recentListings.length === 0 ? (
            <p className="text-sm text-gray-400">—</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentListings.map((l) => (
                <li key={l._id.toString()} className="py-2 flex items-center justify-between gap-3">
                  <Link href={`/listings/${l._id.toString()}`} className="text-sm text-gray-900 hover:text-[#0E4A5C] truncate">
                    {l.breed || "—"}
                  </Link>
                  <span className="text-xs text-gray-400 shrink-0">{LISTING_TYPE_LABEL[l.type ?? ""] ?? l.type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Pending businesses</h2>
            <Link href="/admin/businesses" className="text-xs text-[#0E4A5C] hover:underline">მოდერაცია →</Link>
          </div>
          {recentPending.length === 0 ? (
            <p className="text-sm text-gray-400">No pending submissions.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentPending.map((b) => (
                <li key={b._id.toString()} className="py-2 flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-900 truncate">{b.name || "—"}</span>
                  <span className="text-xs text-gray-400 shrink-0">{CATEGORY_LABEL[b.category ?? ""] ?? b.category}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
