import {
  Activity,
  Briefcase,
  FolderKanban,
  LayoutDashboard,
  Receipt,
  Target,
  UserCheck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Users,
  Briefcase,
  UserCheck,
  Target,
  FolderKanban,
  Receipt,
  Activity,
  Zap,
  LayoutDashboard,
};

export function DashboardIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? LayoutDashboard;
  return <Icon className={className} />;
}
