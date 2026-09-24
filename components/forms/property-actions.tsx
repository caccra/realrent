"use client";

import { useState } from "react";
import { EditPropertyForm } from "@/components/forms/edit-property-form";
import { DeletePropertyButton } from "@/components/forms/delete-property-button";
import { SecondaryButton, Card } from "@/components/ui";
import type { PropertyInput } from "@/lib/validations/property";

export function PropertyActions({
  property,
  unitCount,
  canDelete = true,
}: {
  property: { id: string } & PropertyInput;
  unitCount: number;
  canDelete?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Card className="mb-6">
        <EditPropertyForm
          propertyId={property.id}
          defaultValues={{
            name: property.name,
            address: property.address,
            location: property.location,
            description: property.description,
            usage: property.usage,
            propertyType: property.propertyType,
            amenities: property.amenities,
            listingType: property.listingType,
            salePrice: property.salePrice,
            saleCurrency: property.saleCurrency,
            saleBedrooms: property.saleBedrooms,
            saleBathrooms: property.saleBathrooms,
          }}
          onDone={() => setEditing(false)}
        />
      </Card>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <SecondaryButton onClick={() => setEditing(true)}>Edit property</SecondaryButton>
      {canDelete && <DeletePropertyButton propertyId={property.id} unitCount={unitCount} />}
    </div>
  );
}
