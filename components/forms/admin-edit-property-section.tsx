"use client";

import { useState } from "react";
import { EditPropertyForm } from "@/components/forms/edit-property-form";
import { SecondaryButton, Card } from "@/components/ui";
import type { PropertyInput } from "@/lib/validations/property";

export function AdminEditPropertySection({
  propertyId,
  defaultValues,
}: {
  propertyId: string;
  defaultValues: PropertyInput;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Card className="mb-6">
        <EditPropertyForm propertyId={propertyId} defaultValues={defaultValues} onDone={() => setEditing(false)} />
      </Card>
    );
  }

  return (
    <SecondaryButton className="mb-6" onClick={() => setEditing(true)}>
      Edit property
    </SecondaryButton>
  );
}
