export const ASSIGNABLE_MODULES = [
  "HR",
  "Finance",
  "Sales",
  "Projects",
  "Operations",
  "Marketing",
] as const;

export const OFFICE_TYPES = ["None", "Primary", "Corporate", "Both"] as const;

export const COUNTRIES = ["India", "United States", "United Kingdom", "UAE", "Singapore"] as const;

export const INDIAN_STATES: Record<string, string[]> = {
  India: [
    "Karnataka",
    "Maharashtra",
    "Tamil Nadu",
    "Delhi",
    "Telangana",
    "Gujarat",
    "Kerala",
    "West Bengal",
  ],
};
