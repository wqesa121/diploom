import { Schema, model, models, type InferSchemaType } from "mongoose";

const apiRateLimitSchema = new Schema(
  {
    route: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    count: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    resetAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

apiRateLimitSchema.index({ route: 1, key: 1 }, { unique: true });
apiRateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export type ApiRateLimitDocument = InferSchemaType<typeof apiRateLimitSchema> & { _id: string };

export const ApiRateLimit = models.ApiRateLimit || model("ApiRateLimit", apiRateLimitSchema);