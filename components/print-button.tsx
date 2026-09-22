"use client";

import { SecondaryButton } from "@/components/ui";

export function PrintButton({ label = "Print receipt" }: { label?: string }) {
  return <SecondaryButton onClick={() => window.print()}>{label}</SecondaryButton>;
}
