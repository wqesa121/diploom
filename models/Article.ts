import { Schema, model, models, type InferSchemaType, type Types } from "mongoose";

const articleSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    metaTitle: {
      type: String,
      required: true,
      trim: true,
    },
    metaDescription: {
      type: String,
      required: true,
      trim: true,
    },
    excerpt: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: Schema.Types.Mixed,
      required: true,
    },
    markdown: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    featuredImage: {
      type: String,
      default: "",
    },
    additionalImages: {
      type: [String],
      default: [],
    },
    imageQuery: {
      type: String,
      default: "",
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    seoScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  },
);

export type ArticleDocument = InferSchemaType<typeof articleSchema> & {
  _id: string;
  author: Types.ObjectId;
};

export const Article = models.Article || model("Article", articleSchema);
