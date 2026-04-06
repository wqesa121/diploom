import assert from "node:assert/strict";
import test from "node:test";

import {
  canAccessAdminPath,
  canRunBulkAction,
  canTransitionArticleWorkflow,
  getDefaultAdminPath,
  getRoleLabel,
  hasPermission,
} from "../lib/permissions";

test("admin keeps full access to admin surfaces", () => {
  assert.equal(hasPermission("admin", "users:manage"), true);
  assert.equal(hasPermission("admin", "articles:publish"), true);
  assert.equal(canAccessAdminPath("/admin/users", "admin"), true);
  assert.equal(canAccessAdminPath("/admin/articles/123/edit", "admin"), true);
  assert.equal(canRunBulkAction("admin", "delete"), true);
  assert.equal(canTransitionArticleWorkflow("admin", "published"), true);
});

test("editor can work on content but not manage users or publish", () => {
  assert.equal(hasPermission("editor", "articles:create"), true);
  assert.equal(hasPermission("editor", "users:view"), false);
  assert.equal(canAccessAdminPath("/admin/articles", "editor"), true);
  assert.equal(canAccessAdminPath("/admin/users", "editor"), false);
  assert.equal(canRunBulkAction("editor", "review"), true);
  assert.equal(canRunBulkAction("editor", "publish"), false);
  assert.equal(canTransitionArticleWorkflow("editor", "in_review"), true);
  assert.equal(canTransitionArticleWorkflow("editor", "published"), false);
});

test("reviewer defaults into review queue and cannot access edit surfaces", () => {
  assert.equal(getDefaultAdminPath("reviewer"), "/admin/review");
  assert.equal(getRoleLabel("reviewer"), "Reviewer");
  assert.equal(hasPermission("reviewer", "review:comment"), true);
  assert.equal(hasPermission("reviewer", "articles:edit"), false);
  assert.equal(canAccessAdminPath("/admin/review", "reviewer"), true);
  assert.equal(canAccessAdminPath("/admin/articles/new", "reviewer"), false);
  assert.equal(canAccessAdminPath("/admin/articles/123/compare", "reviewer"), true);
  assert.equal(canRunBulkAction("reviewer", "draft"), false);
  assert.equal(canTransitionArticleWorkflow("reviewer", "draft"), true);
  assert.equal(canTransitionArticleWorkflow("reviewer", "in_review"), false);
});