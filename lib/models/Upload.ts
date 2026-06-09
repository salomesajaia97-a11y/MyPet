import mongoose, { Schema, model, models } from "mongoose";

export interface IUpload {
  _id: string;
  publicId: string;
  url: string;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UploadSchema = new Schema<IUpload>(
  {
    publicId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    uploadedBy: { type: String, required: false },
  },
  { timestamps: true }
);

export default models.Upload || model<IUpload>("Upload", UploadSchema);
