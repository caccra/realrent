import { Badge, Card } from "@/components/ui";
import { StarRating } from "@/components/star-rating";
import type { getTenantScreeningReport } from "@/lib/data";

export function TenantScreeningCard({
  report,
}: {
  report: Awaited<ReturnType<typeof getTenantScreeningReport>>;
}) {
  return (
    <Card className="mb-6">
      <p className="mb-3 text-sm font-medium text-slate-900">Tenant history (across Kezavi)</p>
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-slate-500">Leases</p>
          <p className="font-medium text-slate-900">{report.totalLeases}</p>
        </div>
        <div>
          <p className="text-slate-500">On-time payments</p>
          <p className="font-medium text-slate-900">
            {report.onTimePaymentRate != null ? `${Math.round(report.onTimePaymentRate * 100)}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Landlord rating</p>
          {report.reviewCount > 0 ? (
            <div className="flex items-center gap-1">
              <StarRating rating={report.averageRating ?? 0} />
              <span className="text-slate-600">({report.reviewCount})</span>
            </div>
          ) : (
            <p className="font-medium text-slate-900">—</p>
          )}
        </div>
        <div>
          <p className="text-slate-500">Ended / terminated</p>
          <p className="font-medium text-slate-900">
            {report.endedLeases} / {report.terminatedLeases}
            {report.terminatedLeases > 0 && (
              <Badge tone="red">
                <span className="ml-1">Flag</span>
              </Badge>
            )}
          </p>
        </div>
      </div>

      {report.recentReviews.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
          {report.recentReviews.map((r) => (
            <div key={r.id} className="text-sm">
              <div className="flex items-center gap-2">
                <StarRating rating={r.rating} />
                <span className="text-xs text-slate-400">{r.author.name}</span>
              </div>
              <p className="text-slate-600">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
