export const LANDLORD_NAV = [
  { href: "/landlord/dashboard", label: "Dashboard" },
  { href: "/landlord/properties", label: "Properties" },
  { href: "/landlord/tenants", label: "Tenants" },
  { href: "/landlord/payments", label: "Payments" },
  { href: "/landlord/complaints", label: "Complaints" },
  { href: "/landlord/maintenance", label: "Maintenance" },
  { href: "/landlord/reports", label: "Reports" },
  { href: "/landlord/settings", label: "Settings" },
  { href: "/account/security", label: "Security" },
];

// Property managers get the same working pages as a landlord, minus
// Settings (the landlord's own payout details, not theirs to change).
export const PROPERTY_MANAGER_NAV = LANDLORD_NAV.filter((item) => item.href !== "/landlord/settings");

export function navForRole(role: string | null | undefined) {
  return role === "PROPERTY_MANAGER" ? PROPERTY_MANAGER_NAV : LANDLORD_NAV;
}
