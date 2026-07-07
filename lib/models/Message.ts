import { Schema, model, models } from "mongoose";

const MessageSchema = new Schema(
  {
    threadId: { type: Schema.Types.ObjectId, ref: "Thread", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

MessageSchema.index({ threadId: 1, createdAt: 1 });

export default models.Message || model("Message", MessageSchema);
