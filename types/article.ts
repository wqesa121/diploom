export type ArticleStatus = "draft" | "published";

export type SerializedArticle = {
  id: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  content: Record<string, unknown>;
  markdown: string;
  tags: string[];
  featuredImage: string;
  additionalImages: string[];
  imageQuery: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  status: ArticleStatus;
  seoScore: number;
  createdAt: string;
  updatedAt: string;
};

export type AiGeneratedPayload = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  markdown: string;
  excerpt: string;
  tags: string[];
  imageQuery: string;
  featuredImage: string;
  additionalImages: string[];
  seoScore: number;
};
