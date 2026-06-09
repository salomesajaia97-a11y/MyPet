import { connectDB } from "@/lib/db";
import UserModel from "@/lib/models/User";
import UploadModel from "@/lib/models/Upload";
import { Users, ImageIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await connectDB();
  const [userCount, uploadCount] = await Promise.all([
    UserModel.countDocuments(),
    UploadModel.countDocuments(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 gap-6 max-w-xl">
        <StatCard icon={Users} label="Total Users" value={userCount} />
        <StatCard icon={ImageIcon} label="Total Uploads" value={uploadCount} />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4 shadow-sm">
      <div className="bg-gray-100 rounded-lg p-3">
        <Icon size={22} className="text-gray-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
