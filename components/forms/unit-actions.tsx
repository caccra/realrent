"use client";

import { useState } from "react";
import { EditUnitForm } from "@/components/forms/edit-unit-form";
import { DeleteUnitButton } from "@/components/forms/delete-unit-button";
import { SecondaryButton } from "@/components/ui";
import type { UnitInput } from "@/lib/validations/property";

export function UnitActions({
  unitId,
  defaultValues,
  hasLeaseHistory,
  isCommercial,
}: {
  unitId: string;
  defaultValues: UnitInput;
  hasLeaseHistory: boolean;
  isCommercial?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="mt-3 border-t border-slate-100 pt-3">
        <EditUnitForm
          unitId={unitId}
          defaultValues={defaultValues}
          isCommercial={isCommercial}
          onDone={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
      <SecondaryButton className="text-sm" onClick={() => setEditing(true)}>
        Edit unit
      </SecondaryButton>
      <DeleteUnitButton unitId={unitId} hasLeaseHistory={hasLeaseHistory} />
    </div>
  );
}
