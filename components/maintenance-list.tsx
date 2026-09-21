import { Badge, Card } from "@/components/ui";
import { formatUGX } from "@/lib/money";
import { MaintenanceStatusForm } from "@/components/forms/maintenance-status-form";
import type { getLandlordMaintenanceRequests } from "@/lib/data";

const PRIORITY_TONE = {
  LOW: "slate",
  MEDIUM: "slate",
  HIGH: "amber",
  URGENT: "red",
} as const;

const STATUS_TONE = {
  OPEN: "amber",
  SCHEDULED: "slate",
  IN_PROGRESS: "slate",
  COMPLETED: "green",
  CANCELLED: "slate",
} as const;

type MaintenanceRequest = Awaited<ReturnType<typeof getLandlordMaintenanceRequests>>[number];

export function MaintenanceList({ requests }: { requests: MaintenanceRequest[] }) {
  if (requests.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-500">No maintenance requests yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <Card key={r.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900">{r.title}</p>
              <p className="text-sm text-slate-500">
                {r.property.name}
                {r.unit && ` — ${r.unit.label}`}
              </p>
              {r.description && <p className="mt-1 text-sm text-slate-600">{r.description}</p>}
              <p className="mt-1 text-xs text-slate-400">
                Requested by {r.createdBy.name} on {new Date(r.createdAt).toLocaleDateString("en-UG")}
                {r.scheduledDate && ` · Scheduled ${new Date(r.scheduledDate).toLocaleDateString("en-UG")}`}
                {r.vendor && ` · Vendor: ${r.vendor}`}
                {r.cost != null && ` · Cost: ${formatUGX(r.cost.toString())}`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge tone={STATUS_TONE[r.status]}>{r.status.replace("_", " ")}</Badge>
              <Badge tone={PRIORITY_TONE[r.priority]}>{r.priority}</Badge>
            </div>
          </div>

          <MaintenanceStatusForm
            requestId={r.id}
            defaultValues={{
              status: r.status,
              scheduledDate: r.scheduledDate ? r.scheduledDate.toISOString().slice(0, 10) : "",
              vendor: r.vendor ?? "",
              cost: r.cost != null ? Number(r.cost) : undefined,
            }}
          />
        </Card>
      ))}
    </div>
  );
}
