export const ROLES = {
  SUPERADMIN: "SUPERADMIN",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  USER: "USER",
  VIEWER: "VIEWER",
} as const;

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Intern",
  "Consultant",
  "Freelancer",
] as const;

export const EMPLOYEE_STATUSES = [
  "Active",
  "Probation",
  "On Leave",
  "Resigned",
  "Terminated",
] as const;

export const LEAD_STATUSES = [
  "FRESH_LEAD",
  "PROSPECT",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "CONVERTED",
  "DROPPED",
] as const;

export const PROJECT_STATUSES = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
] as const;

export const PROJECT_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const OFFICE_TYPES = ["None", "Primary", "Corporate", "Both"] as const;

export const DEFAULT_DESIGNATIONS = [
  "CEO",
  "CFO",
  "CTO",
  "VP Engineering",
  "VP Sales",
  "Senior Software Engineer",
  "Software Engineer",
  "HR Manager",
  "HR Executive",
  "Sales Manager",
  "Sales Executive",
  "Finance Manager",
  "Accountant",
  "Operations Manager",
  "Data Analyst",
  "UI/UX Designer",
  "Marketing Manager",
  "Product Manager",
  "Team Lead",
  "Intern",
] as const;
