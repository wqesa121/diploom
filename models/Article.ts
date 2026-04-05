import { Schema, model, models, type InferSchemaType, type Types } from "mongoose";

const reviewNoteSchema = new Schema(
  {
    body: {
      type: String,
      required: true,
      trim: true,
    },
    authorName: {
      type: String,
      default: "",
      trim: true,
    },
    authorEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  },
);

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
      enum: ["draft", "in_review", "published"],
      default: "draft",
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    scheduledAt: {
      type: Date,
      default: null,
      index: true,
    },
    seoScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    reviewNotes: {
      type: [reviewNoteSchema],
      default: [],
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
