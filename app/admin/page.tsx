import Link from "next/link";
import { connectDB } from "@/lib/db";
import UserModel from "@/lib/models/User";
import UploadModel from "@/lib/models/Upload";
import BusinessModel from "@/lib/models/Business";
import { Users, ImageIcon, Store } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await connectDB();
  const [userCount, uploadCount, pendingCount] = await Promise.all([
    UserModel.countDocuments(),
    UploadModel.countDocuments(),
    BusinessModel.countDocuments({ status: "pending" }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 gap-6 max-w-xl">
        <StatCard icon={Users} label="Total Users" value={userCount} />
        <StatCard icon={ImageIcon} label="Total Uploads" value={uploadCount} />
        <Link href="/admin/businesses" className="contents">
          <StatCard
            icon={Store}
            label="Pending Businesses"
            value={pendingCount}
            highlight={pendingCount > 0}
          />
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border p-6 flex items-center gap-4 shadow-sm transition-colors ${
        highlight ? "border-amber-300 ring-1 ring-amber-200" : "border-gray-200"
      }`}
    >
      <div className={`rounded-lg p-3 ${highlight ? "bg-amber-50" : "bg-gray-100"}`}>
        <Icon size={22} className={highlight ? "text-amber-600" : "text-gray-600"} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
