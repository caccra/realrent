import Link from "next/link";
import { Badge, Card } from "@/components/ui";

const STATUS_TONE = {
  OPEN: "red",
  IN_PROGRESS: "amber",
  RESOLVED: "green",
} as const;

type ComplaintRow = {
  id: string;
  title: string;
  status: keyof typeof STATUS_TONE;
  createdAt: Date | string;
  tenant: { name: string };
  lease: { unit: { label: string; property: { name: string } } };
};

export function ComplaintsList({ complaints, basePath }: { complaints: ComplaintRow[]; basePath: string }) {
  if (complaints.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-500">No complaints yet.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">Tenant</th>
            <th className="px-4 py-2 font-medium">Property / Unit</th>
            <th className="px-4 py-2 font-medium">Issue</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Reported</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {complaints.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-2 text-slate-900">{c.tenant.name}</td>
              <td className="px-4 py-2 text-slate-600">
                {c.lease.unit.property.name} — {c.lease.unit.label}
              </td>
              <td className="px-4 py-2 text-slate-600">{c.title}</td>
              <td className="px-4 py-2">
                <Badge tone={STATUS_TONE[c.status]}>{c.status.replace("_", " ")}</Badge>
              </td>
              <td className="px-4 py-2 text-slate-600">
                {new Date(c.createdAt).toLocaleDateString("en-UG")}
              </td>
              <td className="px-4 py-2 text-right">
                <Link
                  href={`${basePath}/${c.id}`}
                  className="font-medium text-emerald-700 hover:text-emerald-800"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
