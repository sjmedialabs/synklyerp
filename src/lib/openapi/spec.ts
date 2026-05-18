const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type PathItem = Record<string, unknown>;

function path(
  pathKey: string,
  methods: PathItem,
  tag: string,
  description?: string
): [string, PathItem] {
  const withMeta: PathItem = {};
  for (const [method, def] of Object.entries(methods)) {
    withMeta[method] = {
      tags: [tag],
      security: [{ sessionCookie: [] }],
      ...def,
    };
  }
  if (description) {
    const first = Object.keys(withMeta)[0];
    if (first && typeof withMeta[first] === "object") {
      (withMeta[first] as Record<string, unknown>).description = description;
    }
  }
  return [pathKey, withMeta];
}

const paginatedList = {
  parameters: [
    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
    { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
  ],
};

export function buildOpenApiSpec() {
  const paths: Record<string, PathItem> = Object.fromEntries([
    path("/api/organisation/branches", {
      get: { summary: "List branches", ...paginatedList },
      post: { summary: "Create branch" },
    }, "Organisation"),
    path("/api/organisation/branches/{id}", {
      get: { summary: "Get branch", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }] },
      patch: { summary: "Update branch", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }] },
      delete: { summary: "Delete branch", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }] },
    }, "Organisation"),
    path("/api/organisation/users", {
      get: { summary: "List organisation users", ...paginatedList },
      post: { summary: "Create organisation user" },
    }, "Organisation"),
    path("/api/organisation/users/stats", {
      get: { summary: "Organisation user statistics" },
    }, "Organisation"),
    path("/api/hr/employees", {
      get: { summary: "List employees", ...paginatedList },
      post: { summary: "Create employee" },
    }, "HR", "Requires HR module"),
    path("/api/hr/employees/stats", {
      get: { summary: "Employee statistics" },
    }, "HR"),
    path("/api/hr/attendance", {
      get: { summary: "List attendance records", ...paginatedList },
      post: { summary: "Record attendance" },
    }, "HR"),
    path("/api/hr/attendance/summary", {
      get: { summary: "Attendance summary for today" },
    }, "HR"),
    path("/api/hr/payroll/cycles", {
      get: { summary: "List payroll cycles" },
      post: { summary: "Create draft payroll cycle" },
    }, "HR"),
    path("/api/hr/payroll/stats", {
      get: { summary: "Payroll YTD statistics" },
    }, "HR"),
    path("/api/finance/services", {
      get: { summary: "List services", ...paginatedList },
      post: { summary: "Create service" },
    }, "Finance", "Requires Finance module"),
    path("/api/finance/services/stats", {
      get: { summary: "Finance services statistics" },
    }, "Finance"),
    path("/api/finance/pricing", {
      get: { summary: "List pricing rules", ...paginatedList },
      post: { summary: "Create pricing rule" },
    }, "Finance"),
    path("/api/finance/packages", {
      get: { summary: "List service packages", ...paginatedList },
      post: { summary: "Create package" },
    }, "Finance"),
    path("/api/finance/sla", {
      get: { summary: "List SLA policies", ...paginatedList },
      post: { summary: "Create SLA policy" },
    }, "Finance"),
    path("/api/sales/leads", {
      get: { summary: "List leads", ...paginatedList },
      post: { summary: "Create lead" },
    }, "Sales", "Requires Sales module"),
    path("/api/sales/leads/stats", {
      get: { summary: "Lead pipeline statistics" },
    }, "Sales"),
    path("/api/projects", {
      get: { summary: "List projects", ...paginatedList },
      post: { summary: "Create project" },
    }, "Projects", "Requires Projects module"),
    path("/api/projects/stats", {
      get: { summary: "Project statistics" },
    }, "Projects"),
    path("/api/tenant/onboarding", {
      get: { summary: "Get onboarding state" },
      patch: { summary: "Save onboarding draft" },
    }, "Tenant"),
    path("/api/tenant/onboarding/confirm", {
      post: { summary: "Confirm onboarding and activate modules" },
    }, "Tenant"),
    path("/api/tenant/modules", {
      get: { summary: "List active tenant modules" },
    }, "Tenant"),
    path("/api/tenant/permissions", {
      get: { summary: "List effective permissions for current user" },
    }, "Tenant"),
    path("/api/dashboard/config", {
      get: { summary: "Resolve dashboard widgets for current user" },
    }, "Dashboard"),
    path("/api/activity-logs", {
      get: { summary: "List audit activity", ...paginatedList },
    }, "Enterprise"),
    path("/api/notifications", {
      get: { summary: "List notifications", ...paginatedList },
    }, "Enterprise"),
    path("/api/notifications/unread-count", {
      get: { summary: "Unread notification count" },
    }, "Enterprise"),
  ]);

  return {
    openapi: "3.1.0",
    info: {
      title: "SynklyERP API",
      version: "1.0.0",
      description:
        "Multi-tenant ERP REST API. Authenticate via NextAuth session cookie (`authjs.session-token` in development). " +
        "Module-gated routes return `403 MODULE_DISABLED` when the tenant has not activated the required module.",
    },
    servers: [{ url: SITE_URL }],
    tags: [
      { name: "Organisation", description: "Branches, users, taxes — always available after onboarding" },
      { name: "HR", description: "Employees, attendance, payroll" },
      { name: "Finance", description: "Services hub, pricing, packages, SLA" },
      { name: "Sales", description: "CRM leads" },
      { name: "Projects", description: "Project bucket and stats" },
      { name: "Tenant", description: "Onboarding, modules, permissions" },
      { name: "Dashboard", description: "Dynamic dashboard configuration" },
      { name: "Enterprise", description: "Notifications and audit logs" },
    ],
    components: {
      securitySchemes: {
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "authjs.session-token",
          description: "NextAuth session cookie (name may vary by environment)",
        },
      },
      schemas: {
        ApiSuccess: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {},
            meta: { type: "object", nullable: true },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                message: { type: "string" },
                code: { type: "string", example: "MODULE_DISABLED" },
              },
            },
          },
        },
      },
      responses: {
        Unauthorized: { description: "Not authenticated" },
        Forbidden: { description: "RBAC or module gate denied" },
        ModuleDisabled: {
          description: "Tenant module not active",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
      },
    },
    paths,
  };
}
