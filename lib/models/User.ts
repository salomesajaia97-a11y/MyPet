import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  image?: string;
  balance: number;
  role: "user" | "admin";
  favorites: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false, default: "" },
    image: { type: String, required: false },
    balance: { type: Number, default: 0 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    // Listings the user has hearted.
    favorites: [{ type: Schema.Types.ObjectId, ref: "Listing" }],
  },
  { timestamps: true }
);

export default models.User || model<IUser>("User", UserSchema);
