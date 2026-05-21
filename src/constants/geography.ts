import { COUNTRIES, INDIAN_STATES } from "@/constants/organisation";

export { COUNTRIES, INDIAN_STATES };

export const CITIES_BY_STATE: Record<string, string[]> = {
  Karnataka: ["Bengaluru", "Mysuru", "Mangalore", "Hubballi"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  Delhi: ["New Delhi", "Dwarka", "Rohini"],
  Telangana: ["Hyderabad", "Warangal", "Karimnagar"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara"],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur"],
};

export function getStatesForCountry(country: string): string[] {
  return INDIAN_STATES[country] ?? [];
}

export function getCitiesForState(state: string): string[] {
  return CITIES_BY_STATE[state] ?? [];
}
