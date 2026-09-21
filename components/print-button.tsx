"use client";

import { SecondaryButton } from "@/components/ui";

export function PrintButton() {
  return <SecondaryButton onClick={() => window.print()}>Print receipt</SecondaryButton>;
}
