import { Schema, model, models, type InferSchemaType } from "mongoose";

const articleRevisionSchema = new Schema(
  {
    articleId: {
      type: Schema.Types.ObjectId,
      ref: "Article",
      required: true,
      index: true,
    },
    revision: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
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
    status: {
      type: String,
      enum: ["draft", "in_review", "published"],
      required: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    seoScore: {
      type: Number,
      default: 0,
    },
    editorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    editorName: {
      type: String,
      default: "",
      trim: true,
    },
    editorEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  },
);

articleRevisionSchema.index({ articleId: 1, revision: -1 }, { unique: true });

export type ArticleRevisionDocument = InferSchemaType<typeof articleRevisionSchema> & { _id: string };

export const ArticleRevision = models.ArticleRevision || model("ArticleRevision", articleRevisionSchema);