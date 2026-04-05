import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bot, CalendarClock, Images, SearchCheck } from "lucide-react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFeaturedPublishedArticle, getPublishedArticles } from "@/lib/articles";
import { formatRelativeDate } from "@/lib/utils";

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
  const featuredPost = await getFeaturedPublishedArticle();
  const { data: latestPosts } = await getPublishedArticles({ page: 1, limit: 4 });
  const editorialPosts = featuredPost ? latestPosts.filter((post) => post.id !== featuredPost.id) : latestPosts;
  const supportingPosts = editorialPosts.slice(0, 2);
  const metricsPosts = featuredPost ? [featuredPost, ...editorialPosts] : latestPosts;
  const uniqueTags = Array.from(new Set(metricsPosts.flatMap((post) => post.tags))).slice(0, 6);
  const uniqueAuthors = Array.from(new Set(metricsPosts.map((post) => post.author.name))).length;

  return (
    <main className="container space-y-16 py-10 md:py-16">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/75 px-6 py-8 shadow-[0_35px_120px_-45px_rgba(15,23,42,0.28)] backdrop-blur md:px-8 md:py-10 xl:px-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.22),transparent_36%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.18),transparent_28%)]" />
        <div className="relative grid gap-10 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
          <section className="space-y-8">
            <div className="inline-flex w-fit items-center rounded-full border border-primary/15 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            NeuraCMS • Next.js 15 • Gemini • MongoDB
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 md:text-6xl xl:text-7xl">
                Headless CMS, который выглядит как редакция, а работает как AI publishing engine.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                NeuraCMS объединяет редакторский workflow, SEO-структуру, AI-генерацию и публичную delivery surface. Это не просто админка, а полноценный publishing pipeline от draft до live-статьи.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-primary/10 bg-white/85 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Live posts</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{metricsPosts.length}</p>
                <p className="mt-2 text-sm text-muted-foreground">Публикации уже выводятся на главную и в public feed.</p>
              </div>
              <div className="rounded-[1.5rem] border border-primary/10 bg-white/85 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Topics</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{uniqueTags.length}</p>
                <p className="mt-2 text-sm text-muted-foreground">Теги формируют discoverability и related-content слой.</p>
              </div>
              <div className="rounded-[1.5rem] border border-primary/10 bg-white/85 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Authors</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{uniqueAuthors}</p>
                <p className="mt-2 text-sm text-muted-foreground">Один интерфейс для редактора, автора и headless delivery.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={session?.user ? "/admin" : "/login"}>
                  {session?.user ? "Открыть dashboard" : "Войти в админку"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/posts">Открыть публикации</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/api/posts">Headless API</Link>
              </Button>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1">
            {featuredPost ? (
              <Card className="overflow-hidden border-white/80 bg-slate-950 text-white shadow-[0_30px_80px_-35px_rgba(15,23,42,0.8)]">
                {featuredPost.featuredImage ? (
                  <div className="relative aspect-[16/10]">
                    <Image src={featuredPost.featuredImage} alt={featuredPost.title} fill className="object-cover opacity-70" unoptimized priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
                  </div>
                ) : null}
                <CardContent className="relative space-y-5 p-6 pt-6">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">Editor&apos;s pick</Badge>
                    {featuredPost.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} className="border-white/10 bg-white/5 text-white/90">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-semibold leading-tight">{featuredPost.title}</h2>
                    <p className="line-clamp-3 text-sm leading-6 text-white/75">{featuredPost.excerpt}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/65">
                    <span>{featuredPost.author.name}</span>
                    <span>{formatRelativeDate(featuredPost.updatedAt)}</span>
                  </div>
                  <Button asChild variant="secondary" className="w-full bg-white text-slate-950 hover:bg-white/90">
                    <Link href={`/posts/${featuredPost.slug}`}>
                      Читать featured article
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid gap-4">
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
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/70 bg-white/85">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Editorial flow
              </div>
              <CardTitle className="text-3xl">От идеи до публикации в одном потоке</CardTitle>
              <CardDescription className="max-w-2xl leading-7">
                Генерация через Gemini, подбор изображений, internal preview, external preview по токену и scheduled publishing уже собраны в одном продукте.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] bg-secondary/60 p-4">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <p className="font-semibold text-slate-950">Generate</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Тема, tone of voice и аудитория превращаются в SEO-ready markdown, meta и slug.</p>
            </div>
            <div className="rounded-[1.5rem] bg-secondary/60 p-4">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Images className="h-5 w-5" />
              </div>
              <p className="font-semibold text-slate-950">Preview</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Команда проверяет материал во внутреннем preview или делится приватной ссылкой с клиентом.</p>
            </div>
            <div className="rounded-[1.5rem] bg-secondary/60 p-4">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CalendarClock className="h-5 w-5" />
              </div>
              <p className="font-semibold text-slate-950">Go live</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Публикация может выйти сразу или по расписанию, после чего попадает в public pages и API.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-slate-950 text-white">
          <CardHeader>
            <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
              Signal board
            </div>
            <CardTitle className="text-3xl text-white">Что уже доступно прямо сейчас</CardTitle>
            <CardDescription className="text-white/65">
              Платформа уже закрывает базовый сценарий редакционного headless publishing без внешних CMS и SaaS-пайплайнов.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-white/75">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">Auth.js login и управление паролем из админки.</div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">Draft, internal preview и external preview по приватному токену.</div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">Scheduled publishing и live выдача через public site и JSON API.</div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Latest Published Content
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Последние опубликованные статьи</h2>
            <p className="max-w-2xl text-muted-foreground">
              Главная страница теперь показывает реальные материалы из CMS, а не только промо-блоки. Это уже готовый public-facing слой поверх headless API.
            </p>
          </div>
          <Button asChild>
            <Link href="/posts">
              Все публикации
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {latestPosts.length === 0 ? (
          <Card className="border-dashed bg-white/70">
            <CardContent className="p-10 text-center text-muted-foreground">
              Пока нет опубликованных статей. Опубликуйте первую статью из админки, чтобы она появилась здесь.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            {featuredPost ? (
              <Card className="overflow-hidden border-white/70 bg-white/90">
                <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                  {featuredPost.featuredImage ? (
                    <div className="relative min-h-[320px] bg-secondary">
                      <Image src={featuredPost.featuredImage} alt={featuredPost.title} fill className="object-cover" unoptimized />
                    </div>
                  ) : null}
                  <div className="flex flex-col justify-between p-6 md:p-8">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge>Lead story</Badge>
                        {featuredPost.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{featuredPost.title}</h3>
                      <p className="max-w-2xl text-base leading-7 text-muted-foreground">{featuredPost.excerpt}</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{featuredPost.author.name}</span>
                        <span>{formatRelativeDate(featuredPost.updatedAt)}</span>
                      </div>
                      <Button asChild>
                        <Link href={`/posts/${featuredPost.slug}`}>
                          Открыть статью
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            <div className="grid gap-5">
              {(supportingPosts.length ? supportingPosts : editorialPosts).map((post) => (
              <Card key={post.id} className="overflow-hidden border-white/70 bg-white/85">
                {post.featuredImage ? (
                  <div className="relative aspect-[4/3] bg-secondary">
                    <Image src={post.featuredImage} alt={post.title} fill className="object-cover" unoptimized />
                  </div>
                ) : null}
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="line-clamp-2 text-2xl">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-3 leading-6">{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{post.author.name}</span>
                    <span>{formatRelativeDate(post.updatedAt)}</span>
                  </div>
                  <Button asChild className="w-full">
                    <Link href={`/posts/${post.slug}`}>
                      Открыть статью
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        )}

        {uniqueTags.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {uniqueTags.map((tag) => (
              <Button key={tag} asChild variant="outline" size="sm">
                <Link href={`/posts?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
              </Button>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
