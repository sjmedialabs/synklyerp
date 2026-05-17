export type OrgTax = {
  id: string;
  tenantId: string;
  name: string;
  rate: number;
  type: string;
  status: string;
  createdAt: string;
};

export type Service = {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  description: string | null;
  basePrice: number;
  unit: string;
  status: string;
  createdAt: string;
};

export type PricingRule = {
  id: string;
  tenantId: string;
  name: string;
  segment: string | null;
  condition: string | null;
  adjustment: number;
  status: string;
  createdAt: string;
};

export type ServicePackage = {
  id: string;
  tenantId: string;
  name: string;
  includedServices: unknown[];
  discount: number;
  validityDays: number | null;
  status: string;
  createdAt: string;
};

export type ServiceSLA = {
  id: string;
  tenantId: string;
  serviceName: string;
  responseTime: string;
  resolutionTime: string;
  escalationRules: string | null;
  status: string;
  createdAt: string;
};

export type Lead = {
  id: string;
  tenantId: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  leadType: string;
  serviceId: string | null;
  source: string | null;
  assignedTo: string | null;
  status: string;
  progress: number;
  notes: string | null;
  createdAt: string;
  service?: { id: string; name: string } | null;
  assignee?: { id: string; name: string | null } | null;
};

export type Project = {
  id: string;
  tenantId: string;
  name: string;
  clientName: string;
  managerId: string | null;
  managerName: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  dueDate: string | null;
  budget: number | null;
  progress: number;
  tags: string[];
  description: string | null;
  createdAt: string;
};

export type Employee = {
  id: string;
  tenantId: string;
  employeeCode: string;
  fullName: string;
  dateOfJoining: string;
  designationId: string;
  department: string | null;
  branchId: string;
  divisionId: string;
  employmentType: string;
  status: string;
  workEmail: string | null;
  personalEmail: string | null;
  phoneNumber: string | null;
  emergencyContact: string | null;
  reportingToId: string | null;
  isDraft: boolean;
  createdAt: string;
  designation?: { id: string; name: string } | null;
  branch?: { id: string; name: string } | null;
  division?: { id: string; name: string } | null;
  manager?: { id: string; fullName: string } | null;
};

export type Attendance = {
  id: string;
  employeeId: string;
  date: string;
  punchIn: string | null;
  punchOut: string | null;
  status: string;
  otHours: number;
  flags: string | null;
  employee?: { id: string; fullName: string; employeeCode: string } | null;
};

function num(v: unknown) {
  return typeof v === "number" ? v : Number(v ?? 0);
}

export function mapOrgTax(row: Record<string, unknown>): OrgTax {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    rate: num(row.rate),
    type: row.type as string,
    status: row.status as string,
    createdAt: row.created_at as string,
  };
}

export function mapService(row: Record<string, unknown>): Service {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    category: row.category as string,
    description: (row.description as string) ?? null,
    basePrice: num(row.base_price),
    unit: row.unit as string,
    status: row.status as string,
    createdAt: row.created_at as string,
  };
}

export function mapPricingRule(row: Record<string, unknown>): PricingRule {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    segment: (row.segment as string) ?? null,
    condition: (row.condition_text as string) ?? null,
    adjustment: num(row.adjustment),
    status: row.status as string,
    createdAt: row.created_at as string,
  };
}

export function mapServicePackage(row: Record<string, unknown>): ServicePackage {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    includedServices: (row.included_services as unknown[]) ?? [],
    discount: num(row.discount),
    validityDays: row.validity_days != null ? Number(row.validity_days) : null,
    status: row.status as string,
    createdAt: row.created_at as string,
  };
}

export function mapServiceSLA(row: Record<string, unknown>): ServiceSLA {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    serviceName: row.service_name as string,
    responseTime: row.response_time as string,
    resolutionTime: row.resolution_time as string,
    escalationRules: (row.escalation_rules as string) ?? null,
    status: row.status as string,
    createdAt: row.created_at as string,
  };
}

export function mapLead(row: Record<string, unknown>): Lead {
  const service = row.services as { id: string; name: string } | { id: string; name: string }[] | null;
  const assignee = row.users as { id: string; name: string } | { id: string; name: string }[] | null;
  const s = Array.isArray(service) ? service[0] : service;
  const a = Array.isArray(assignee) ? assignee[0] : assignee;
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    company: (row.company as string) ?? null,
    phone: (row.phone as string) ?? null,
    email: (row.email as string) ?? null,
    leadType: row.lead_type as string,
    serviceId: (row.service_id as string) ?? null,
    source: (row.source as string) ?? null,
    assignedTo: (row.assigned_to as string) ?? null,
    status: row.status as string,
    progress: Number(row.progress ?? 0),
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
    service: s ?? null,
    assignee: a ? { id: a.id, name: a.name } : null,
  };
}

export function mapProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    clientName: row.client_name as string,
    managerId: (row.manager_id as string) ?? null,
    managerName: (row.manager_name as string) ?? null,
    status: row.status as string,
    priority: row.priority as string,
    startDate: (row.start_date as string) ?? null,
    dueDate: (row.due_date as string) ?? null,
    budget: row.budget != null ? num(row.budget) : null,
    progress: Number(row.progress ?? 0),
    tags: (row.tags as string[]) ?? [],
    description: (row.description as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapEmployee(row: Record<string, unknown>): Employee {
  const pick = (k: string) => {
    const v = row[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    employeeCode: row.employee_code as string,
    fullName: row.full_name as string,
    dateOfJoining: row.date_of_joining as string,
    designationId: row.designation_id as string,
    department: (row.department as string) ?? null,
    branchId: row.branch_id as string,
    divisionId: row.division_id as string,
    employmentType: row.employment_type as string,
    status: row.status as string,
    workEmail: (row.work_email as string) ?? null,
    personalEmail: (row.personal_email as string) ?? null,
    phoneNumber: (row.phone_number as string) ?? null,
    emergencyContact: (row.emergency_contact as string) ?? null,
    reportingToId: (row.reporting_to_id as string) ?? null,
    isDraft: Boolean(row.is_draft),
    createdAt: row.created_at as string,
    designation: pick("designations") as Employee["designation"],
    branch: pick("branches") as Employee["branch"],
    division: pick("divisions") as Employee["division"],
    manager: pick("manager") as Employee["manager"],
  };
}

export function mapAttendance(row: Record<string, unknown>): Attendance {
  const emp = row.employees as { id: string; full_name: string; employee_code: string } | null;
  const e = Array.isArray(emp) ? emp[0] : emp;
  return {
    id: row.id as string,
    employeeId: row.employee_id as string,
    date: row.date as string,
    punchIn: (row.punch_in as string) ?? null,
    punchOut: (row.punch_out as string) ?? null,
    status: row.status as string,
    otHours: num(row.ot_hours),
    flags: (row.flags as string) ?? null,
    employee: e ? { id: e.id, fullName: e.full_name, employeeCode: e.employee_code } : null,
  };
}
