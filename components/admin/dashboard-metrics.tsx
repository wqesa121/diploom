import { CalendarClock, Eye, FileText, Gauge, Globe2, Sparkles, Tags } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardMetricsProps = {
  totalArticles: number;
  liveArticles: number;
  scheduledArticles: number;
  draftArticles: number;
  reviewArticles: number;
  totalTags: number;
  averageSeoScore: number;
};

const items = [
  {
    key: "totalArticles",
    label: "Всего материалов",
    icon: FileText,
    accent: "from-teal-500/20 to-emerald-400/10",
  },
  {
    key: "liveArticles",
    label: "Live сейчас",
    icon: Globe2,
    accent: "from-sky-500/20 to-cyan-400/10",
  },
  {
    key: "scheduledArticles",
    label: "Scheduled",
    icon: CalendarClock,
    accent: "from-violet-500/20 to-fuchsia-300/10",
  },
  {
    key: "draftArticles",
    label: "Черновики",
    icon: Sparkles,
    accent: "from-amber-500/20 to-yellow-300/10",
  },
  {
    key: "reviewArticles",
    label: "In review",
    icon: Eye,
    accent: "from-indigo-500/20 to-sky-300/10",
  },
  {
    key: "totalTags",
    label: "Уникальных тегов",
    icon: Tags,
    accent: "from-rose-500/20 to-orange-300/10",
  },
  {
    key: "averageSeoScore",
    label: "Средний SEO score",
    icon: Gauge,
    accent: "from-lime-500/20 to-emerald-300/10",
  },
] as const;

export function DashboardMetrics(props: DashboardMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {items.map((item) => {
        const Icon = item.icon;
        const value = props[item.key];

        return (
          <Card key={item.key} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className={`rounded-[1.25rem] bg-gradient-to-br ${item.accent} p-3`}>
                <Icon className="h-5 w-5 text-foreground" />
              </div>
              <CardTitle className="text-base font-medium text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold tracking-tight">{value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
