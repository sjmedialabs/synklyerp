import {
  Brain,
  Briefcase,
  Building2,
  Circle,
  Cloud,
  Code,
  Coffee,
  Dumbbell,
  Factory,
  HeartPulse,
  Package,
  Server,
  Shield,
  Shirt,
  ShoppingBasket,
  ShoppingCart,
  Smartphone,
  Sofa,
  Store,
  Truck,
  Utensils,
  Wine,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  package: Package,
  briefcase: Briefcase,
  zap: Zap,
  factory: Factory,
  store: Store,
  "shopping-cart": ShoppingCart,
  code: Code,
  "heart-pulse": HeartPulse,
  utensils: Utensils,
  dumbbell: Dumbbell,
  brain: Brain,
  cloud: Cloud,
  server: Server,
  shield: Shield,
  "shopping-basket": ShoppingBasket,
  shirt: Shirt,
  smartphone: Smartphone,
  sofa: Sofa,
  coffee: Coffee,
  wine: Wine,
  truck: Truck,
  "building-2": Building2,
  circle: Circle,
};

export function resolveOnboardingIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Circle;
  return ICON_MAP[name] ?? Circle;
}

export function themeAccentClass(themeColor: string | null | undefined): string {
  switch (themeColor) {
    case "amber":
      return "border-amber-500/50 bg-amber-500/10 ring-amber-500/30";
    case "indigo":
      return "border-indigo-500/50 bg-indigo-500/10 ring-indigo-500/30";
    case "yellow":
      return "border-yellow-500/50 bg-yellow-500/10 ring-yellow-500/30";
    default:
      return "border-indigo-500/50 bg-indigo-500/10 ring-indigo-500/30";
  }
}
