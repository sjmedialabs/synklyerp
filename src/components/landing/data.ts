import {
  Users,
  Receipt,
  Building2,
  Briefcase,
  FolderKanban,
  Bell,
  Shield,
  FileStack,
  BarChart3,
  Search,
  Workflow,
} from "lucide-react";

export const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "Solutions", href: "#solutions" },
  { label: "Resources", href: "#resources" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

export const TRUST_LOGOS = [
  "Nimbus Tech",
  "RetailOne",
  "Vertex Labs",
  "CloudNine",
  "Apex Systems",
  "Horizon Co",
];

export const PLATFORM_MODULES = [
  {
    id: "hr",
    title: "Synkly HR",
    description: "Employee records, attendance, leave, and payroll-ready workflows in one place.",
    href: "/login",
    accent: "from-violet-500 to-purple-600",
    mock: "hr" as const,
  },
  {
    id: "finance",
    title: "Synkly Finance",
    description: "Service catalog, pricing rules, packages, SLA policies, and tax configuration.",
    href: "/login",
    accent: "from-emerald-500 to-teal-600",
    mock: "finance" as const,
  },
  {
    id: "organisation",
    title: "Synkly Organisation",
    description: "Branches, divisions, designations, and user access across your company structure.",
    href: "/login",
    accent: "from-blue-500 to-indigo-600",
    mock: "org" as const,
  },
  {
    id: "sales",
    title: "Synkly Sales & CRM",
    description: "Lead pipeline, customer management, orders, and revenue targets.",
    href: "/login",
    accent: "from-orange-500 to-amber-600",
    mock: "sales" as const,
  },
  {
    id: "projects",
    title: "Synkly Projects",
    description: "Project bucket, tasks, milestones, resources, and delivery tracking.",
    href: "/login",
    accent: "from-pink-500 to-rose-600",
    mock: "projects" as const,
  },
  {
    id: "platform",
    title: "Synkly Platform",
    description: "Notifications, audit logs, multi-tenant RBAC, and enterprise search readiness.",
    href: "/login",
    accent: "from-slate-600 to-slate-800",
    mock: "platform" as const,
  },
];

export const QUICK_ACTIONS = [
  { icon: Building2, label: "Setup Org", desc: "Branches & users", href: "/login" },
  { icon: Users, label: "Manage HR", desc: "Employees & leave", href: "/login" },
  { icon: Receipt, label: "Run Finance", desc: "Services & billing", href: "/login" },
  { icon: BarChart3, label: "View Analytics", desc: "Dashboards & KPIs", href: "/login" },
];

export const HIGHLIGHT_TABS = [
  {
    id: "organisation",
    label: "Organisation",
    headline: "Structure every branch and division",
    body: "Configure taxes, branches, divisions, designations, and role-based users with tenant isolation.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80",
  },
  {
    id: "hr",
    label: "Human Resources",
    headline: "Your entire workforce, one system",
    body: "Onboard employees, track attendance, manage leave, and prepare for payroll cycles.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&q=80",
  },
  {
    id: "finance",
    label: "Finance",
    headline: "Services, pricing & compliance",
    body: "Catalog services, define SLAs, manage packages, and align with organisation tax rules.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&q=80",
    currencies: ["INR", "USD", "EUR", "GBP", "AED"],
  },
  {
    id: "sales",
    label: "Sales & CRM",
    headline: "From lead to revenue",
    body: "Capture leads, assign owners, track pipeline stages, and connect to projects.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80",
  },
  {
    id: "projects",
    label: "Projects",
    headline: "Deliver work on time",
    body: "Project bucket, priorities, budgets, and progress tracking for every client engagement.",
    image: "https://images.unsplash.com/photo-1531403009284-441f8d3c5c5a?w=900&q=80",
  },
];

export const ENTERPRISE_FEATURES = [
  { icon: Bell, title: "Notification Center", desc: "In-app alerts with read state and preferences." },
  { icon: Shield, title: "Audit & Activity Logs", desc: "CRUD history, login tracking, and security events." },
  { icon: FileStack, title: "File Management", desc: "Centralized uploads with tenant-scoped storage." },
  { icon: BarChart3, title: "Analytics & Reports", desc: "KPI dashboards and export-ready reporting." },
  { icon: Search, title: "Enterprise Search", desc: "Cross-module discovery and smart filters." },
  { icon: Workflow, title: "Workflow Automation", desc: "Approvals, triggers, and escalation rules." },
];

export const STATS = [
  { value: "12+", label: "Integrated modules" },
  { value: "10,000+", label: "Active users" },
  { value: "₹2B+", label: "Processed annually" },
  { value: "99.99%", label: "Platform uptime" },
];

export const TESTIMONIALS = [
  {
    quote: "SynklyERP replaced five disconnected tools. Our HR and finance teams finally share one source of truth.",
    author: "Priya Sharma",
    role: "COO, Nimbus Tech",
    company: "Nimbus Tech",
    image: "https://images.unsplash.com/photo-1573497019940-88c827a86e7e?w=200&q=80",
  },
  {
    quote: "Multi-branch rollout took weeks, not months. Organisation setup and RBAC just worked.",
    author: "James Okonkwo",
    role: "Head of Operations, Vertex Labs",
    company: "Vertex Labs",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
  },
];

export const REVIEWS = [
  { platform: "G2", rating: "4.9/5", text: "Best multi-tenant ERP for growing service businesses." },
  { platform: "Capterra", rating: "4.8/5", text: "Clean UI and real PostgreSQL-backed modules." },
  { platform: "Trustpilot", rating: "4.9/5", text: "Onboarding and support exceeded expectations." },
];

export const PRICING_PLANS = [
  {
    id: "trial",
    name: "Trial",
    price: "₹0",
    period: "14 days",
    description: "Evaluate SynklyERP with full module access for your team.",
    highlighted: false,
    cta: "Start free trial",
    href: "/signup",
    features: [
      "Up to 10 users",
      "All core modules",
      "Onboarding wizard",
      "Email & OTP login",
      "Community support",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "₹499",
    period: "per user / month",
    description: "For growing SMBs running product, service, or hybrid operations.",
    highlighted: true,
    cta: "Get started",
    href: "/signup",
    features: [
      "Unlimited branches",
      "RBAC & audit logs",
      "Module activation by business type",
      "HR, Finance, Sales, Projects",
      "Priority email support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "annual contract",
    description: "For multi-entity organisations with advanced compliance needs.",
    highlighted: false,
    cta: "Contact sales",
    href: "/signup",
    features: [
      "Dedicated tenant isolation",
      "Custom roles & permissions",
      "SSO & security review",
      "Implementation assistance",
      "SLA & phone support",
    ],
  },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "Platform",
    links: ["Organisation", "Human Resources", "Finance", "Sales & CRM", "Projects", "Operations"],
  },
  {
    title: "Solutions",
    links: ["Product companies", "Service businesses", "Hybrid enterprises", "Multi-branch"],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/login" },
      { label: "API reference", href: "/api-docs" },
      { label: "Security", href: "/login" },
      { label: "Status page", href: "/login" },
    ],
  },
  {
    title: "Company",
    links: ["About SynklyERP", "Careers", "Contact", "Partners"],
  },
];
