export type UserRole = "admin" | "editor" | "reviewer";

export type AdminPermission =
  | "dashboard:view"
  | "users:view"
  | "users:manage"
  | "articles:view"
  | "articles:create"
  | "articles:edit"
  | "articles:delete"
  | "articles:publish"
  | "articles:feature"
  | "articles:compare"
  | "articles:preview"
  | "review:view"
  | "review:comment"
  | "account:view";

export const DEFAULT_ROLE: UserRole = "editor";

const rolePermissions: Record<UserRole, AdminPermission[]> = {
  admin: [
    "dashboard:view",
    "users:view",
    "users:manage",
    "articles:view",
    "articles:create",
    "articles:edit",
    "articles:delete",
    "articles:publish",
    "articles:feature",
    "articles:compare",
    "articles:preview",
    "review:view",
    "review:comment",
    "account:view",
  ],
  editor: [
    "dashboard:view",
    "articles:view",
    "articles:create",
    "articles:edit",
    "articles:compare",
    "articles:preview",
    "review:view",
    "review:comment",
    "account:view",
  ],
  reviewer: [
    "dashboard:view",
    "articles:compare",
    "articles:preview",
    "review:view",
    "review:comment",
    "account:view",
  ],
};

export function hasPermission(role: UserRole, permission: AdminPermission) {
  return rolePermissions[role].includes(permission);
}

export function getDefaultAdminPath(role: UserRole) {
  return hasPermission(role, "articles:view") ? "/admin" : "/admin/review";
}

export function getRoleLabel(role: UserRole) {
  switch (role) {
    case "admin":
      return "Administrator";
    case "editor":
      return "Editor";
    case "reviewer":
      return "Reviewer";
    default:
      return "Editor";
  }
}

export function canAccessAdminPath(pathname: string, role: UserRole) {
  if (pathname === "/admin") {
    return hasPermission(role, "dashboard:view");
  }

  if (pathname === "/admin/account") {
    return hasPermission(role, "account:view");
  }

  if (pathname === "/admin/users") {
    return hasPermission(role, "users:view");
  }

  if (pathname === "/admin/review") {
    return hasPermission(role, "review:view");
  }

  if (pathname === "/admin/articles") {
    return hasPermission(role, "articles:view");
  }

  if (pathname === "/admin/articles/new") {
    return hasPermission(role, "articles:create");
  }

  if (/^\/admin\/articles\/[^/]+\/edit$/.test(pathname)) {
    return hasPermission(role, "articles:edit");
  }

  if (/^\/admin\/articles\/[^/]+\/preview$/.test(pathname)) {
    return hasPermission(role, "articles:preview");
  }

  if (/^\/admin\/articles\/[^/]+\/compare$/.test(pathname)) {
    return hasPermission(role, "articles:compare");
  }

  return false;
}

export function canTransitionArticleWorkflow(role: UserRole, nextStatus: "draft" | "in_review" | "published") {
  if (role === "admin") {
    return true;
  }

  if (role === "editor") {
    return nextStatus !== "published";
  }

  return nextStatus === "draft" || nextStatus === "published";
}

export function canRunBulkAction(role: UserRole, action: "publish" | "review" | "draft" | "delete") {
  if (role === "admin") {
    return true;
  }

  if (role === "editor") {
    return action === "review" || action === "draft";
  }

  return false;
}