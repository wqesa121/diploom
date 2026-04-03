import Link from "next/link";
import { ArrowRight, Bot, Images, SearchCheck } from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "AI article generation",
    description: "Gemini автоматически готовит SEO-title, meta description, slug, markdown и теги.",
    icon: Bot,
  },
  {
    title: "Royalty-free imagery",
    description: "Unsplash подбирает 5-6 визуально релевантных изображений по AI-сгенерированному query.",
    icon: Images,
  },
  {
    title: "Headless delivery",
    description: "Публикации доступны через чистый JSON API с пагинацией, поиском и фильтрацией по тегам.",
    icon: SearchCheck,
  },
];

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="container flex min-h-screen flex-col justify-center py-16">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="space-y-8">
          <div className="inline-flex w-fit items-center rounded-full border border-primary/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            NeuraCMS • Next.js 15 • Gemini • MongoDB
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 md:text-6xl">
              Headless CMS с встроенным AI для SEO-контента и автоматического подбора изображений.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Современная headless система управления контентом, использующая встроенный ИИ для автоматической генерации SEO-оптимизированных текстов, расстановки тегов и подбора изображений.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={session?.user ? "/admin" : "/login"}>
                {session?.user ? "Открыть dashboard" : "Войти в админку"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/api/posts">Открыть headless API</Link>
            </Button>
          </div>
        </section>
        <section className="grid gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-white/70 bg-white/80">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="leading-7">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  Production-ready App Router архитектура с Server Components и Server Actions без платных сервисов.
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
