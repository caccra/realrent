"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propertyInquirySchema, type PropertyInquiryInput } from "@/lib/validations/property";
import { Button, Card, FieldError, Input, Label, Textarea } from "@/components/ui";

export function PropertyInquiryForm({ propertyId }: { propertyId: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [wantsViewing, setWantsViewing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PropertyInquiryInput>({ resolver: zodResolver(propertyInquirySchema) });

  async function onSubmit(data: PropertyInquiryInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Card className="border-ivy-200 bg-ivy-50">
        <p className="text-sm font-medium text-ivy-900">Thanks — your inquiry has been sent.</p>
        <p className="mt-1 text-sm text-ivy-800">The seller will reach out to you directly.</p>
      </Card>
    );
  }

  return (
    <Card>
      <p className="mb-3 text-sm font-medium text-slate-900">Interested in this property?</p>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input id="name" {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" placeholder="0771234567" {...register("phone")} />
            <FieldError message={errors.phone?.message} />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" type="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" rows={3} placeholder="I'd like to know more about…" {...register("message")} />
          <FieldError message={errors.message?.message} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={wantsViewing}
            onChange={(e) => setWantsViewing(e.target.checked)}
          />
          I&apos;d like to schedule a viewing
        </label>
        {wantsViewing && (
          <div>
            <Label htmlFor="requestedViewingAt">Preferred date &amp; time</Label>
            <Input id="requestedViewingAt" type="datetime-local" {...register("requestedViewingAt")} />
            <FieldError message={errors.requestedViewingAt?.message} />
          </div>
        )}
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Sending…" : wantsViewing ? "Request viewing" : "Contact seller"}
        </Button>
      </form>
    </Card>
  );
}
