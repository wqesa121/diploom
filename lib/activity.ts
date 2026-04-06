import { ActivityLog } from "@/models/ActivityLog";

type LogActivityParams = {
  actorId?: string;
  actorName?: string | null;
  actorEmail?: string | null;
  entityType: "article" | "account" | "user";
  entityId?: string;
  entityTitle?: string;
  action: "created" | "updated" | "deleted" | "password_changed";
  details?: string;
};

export async function logActivity(params: LogActivityParams) {
  await ActivityLog.create({
    actorId: params.actorId || undefined,
    actorName: params.actorName || "",
    actorEmail: params.actorEmail || "",
    entityType: params.entityType,
    entityId: params.entityId || "",
    entityTitle: params.entityTitle || "",
    action: params.action,
    details: params.details || "",
  });
}

export async function getRecentActivity(limit = 6) {
  const items = await ActivityLog.find().sort({ createdAt: -1 }).limit(limit).lean();

  return items.map((item) => ({
    id: String(item._id),
    actorName: item.actorName || item.actorEmail || "Unknown user",
    actorEmail: item.actorEmail || "",
    entityType: item.entityType,
    entityId: item.entityId || "",
    entityTitle: item.entityTitle || "",
    action: item.action,
    details: item.details || "",
    createdAt: new Date(item.createdAt).toISOString(),
  }));
}