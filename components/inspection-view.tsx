import Image from "next/image";
import { Badge, Card } from "@/components/ui";
import { INSPECTION_CONDITIONS, INSPECTION_TYPES } from "@/lib/validations/inspection";

const CONDITION_TONE = {
  GOOD: "green",
  FAIR: "amber",
  POOR: "red",
} as const;

type InspectionData = {
  id: string;
  type: string;
  notes: string | null;
  createdAt: Date | string;
  conductedBy: { name: string };
  items: { id: string; label: string; condition: string; note: string | null }[];
  photos: { id: string; url: string }[];
};

export function InspectionView({ inspection }: { inspection: InspectionData }) {
  const typeLabel = INSPECTION_TYPES.find((t) => t.value === inspection.type)?.label ?? inspection.type;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-900">{typeLabel} inspection</h3>
        <span className="text-xs text-slate-400">
          {new Date(inspection.createdAt).toLocaleDateString("en-UG")} · {inspection.conductedBy.name}
        </span>
      </div>

      <ul className="space-y-1">
        {inspection.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-slate-700">
              {item.label}
              {item.note && <span className="text-slate-400"> — {item.note}</span>}
            </span>
            <Badge tone={CONDITION_TONE[item.condition as keyof typeof CONDITION_TONE] ?? "slate"}>
              {INSPECTION_CONDITIONS.find((c) => c.value === item.condition)?.label ?? item.condition}
            </Badge>
          </li>
        ))}
      </ul>

      {inspection.notes && <p className="mt-3 text-sm text-slate-600">{inspection.notes}</p>}

      {inspection.photos.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {inspection.photos.map((photo) => (
            <a
              key={photo.id}
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square overflow-hidden rounded-md bg-slate-100"
            >
              <Image src={photo.url} alt="" fill sizes="25vw" className="object-cover" />
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}
