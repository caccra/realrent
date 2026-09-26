"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactMessageSchema, type ContactMessageInput } from "@/lib/validations/contact";
import { Button, Card, FieldError, Input, Label, Textarea } from "@/components/ui";

export function ContactForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactMessageInput>({ resolver: zodResolver(contactMessageSchema) });

  async function onSubmit(data: ContactMessageInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
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
        <p className="text-sm font-medium text-ivy-900">Thanks — your message has been sent.</p>
        <p className="mt-1 text-sm text-ivy-800">We&apos;ll get back to you as soon as we can.</p>
      </Card>
    );
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="Enter your name" {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" placeholder="Enter your email" {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
        </div>
        <div>
          <Label htmlFor="phone">Phone number (optional)</Label>
          <Input id="phone" placeholder="Enter your phone number" {...register("phone")} />
          <FieldError message={errors.phone?.message} />
        </div>
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" placeholder="What can we help you with?" {...register("subject")} />
          <FieldError message={errors.subject?.message} />
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" rows={5} placeholder="Tell us how we can help…" {...register("message")} />
          <FieldError message={errors.message?.message} />
        </div>
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? "Sending…" : "Send Message"}
        </Button>
      </form>
    </Card>
  );
}
