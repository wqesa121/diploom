import { Schema, model, models, type InferSchemaType } from "mongoose";

const activityLogSchema = new Schema(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    actorName: {
      type: String,
      default: "",
      trim: true,
    },
    actorEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    entityType: {
      type: String,
      enum: ["article", "account"],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      default: "",
      trim: true,
    },
    entityTitle: {
      type: String,
      default: "",
      trim: true,
    },
    action: {
      type: String,
      enum: ["created", "updated", "deleted", "password_changed"],
      required: true,
      index: true,
    },
    details: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export type ActivityLogDocument = InferSchemaType<typeof activityLogSchema> & { _id: string };

export const ActivityLog = models.ActivityLog || model("ActivityLog", activityLogSchema);