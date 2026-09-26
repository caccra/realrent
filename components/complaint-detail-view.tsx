import Link from "next/link";
import Image from "next/image";
import { Badge, Card } from "@/components/ui";
import { ComplaintStatusForm } from "@/components/forms/complaint-status-form";
import { formatPhoneForDisplay } from "@/lib/phone";
import { WhatsAppLink } from "@/components/whatsapp-link";
import type { getComplaintDetail } from "@/lib/data";

const STATUS_TONE = {
  OPEN: "red",
  IN_PROGRESS: "amber",
  RESOLVED: "green",
} as const;

export function ComplaintDetailView({
  complaint,
  leaseHref,
}: {
  complaint: NonNullable<Awaited<ReturnType<typeof getComplaintDetail>>>;
  leaseHref: string;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <Badge tone={STATUS_TONE[complaint.status]}>{complaint.status.replace("_", " ")}</Badge>
          <span className="text-sm text-slate-500">
            {new Date(complaint.createdAt).toLocaleDateString("en-UG")}
          </span>
        </div>
        <h2 className="text-lg font-medium text-slate-900">{complaint.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{complaint.description}</p>

        {complaint.images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {complaint.images.map((image) => (
              <a
                key={image.id}
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block aspect-square overflow-hidden rounded-md bg-slate-100"
              >
                <Image src={image.url} alt="" fill sizes="25vw" className="object-cover" />
              </a>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Tenant</p>
            <p className="text-sm text-slate-900">{complaint.tenant.name}</p>
            <p className="flex items-center gap-2 text-sm text-slate-500">
              {complaint.tenant.phone ? formatPhoneForDisplay(complaint.tenant.phone) : "—"}
              <WhatsAppLink
                number={complaint.tenant.whatsappNumber}
                message={`Hi ${complaint.tenant.name}, following up on your complaint: "${complaint.title}"`}
              />
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Property / Unit</p>
            <p className="text-sm text-slate-900">
              {complaint.lease.unit.property.name} — {complaint.lease.unit.label}
            </p>
            <Link href={leaseHref} className="text-sm font-medium text-ivy-700 hover:text-ivy-800">
              View lease →
            </Link>
          </div>
        </div>

        {complaint.resolutionNote && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">Resolution note</p>
            <p className="text-sm text-slate-700">{complaint.resolutionNote}</p>
          </div>
        )}
      </Card>

      <ComplaintStatusForm
        complaintId={complaint.id}
        defaultValues={{ status: complaint.status, resolutionNote: complaint.resolutionNote ?? "" }}
      />
    </div>
  );
}
