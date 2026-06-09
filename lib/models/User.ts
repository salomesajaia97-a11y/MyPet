import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  image?: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false, default: "" },
    image: { type: String, required: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

export default models.User || model<IUser>("User", UserSchema);
