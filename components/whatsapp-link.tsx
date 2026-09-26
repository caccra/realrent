import { whatsappLink } from "@/lib/whatsapp";

export function WhatsAppLink({
  number,
  message,
  className,
}: {
  number: string | null | undefined;
  message?: string;
  className?: string;
}) {
  if (!number) return null;

  return (
    <a
      href={whatsappLink(number, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex items-center gap-1 text-sm font-medium text-ivy-700 hover:text-ivy-800"
      }
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
        <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1s-.7.9-.9 1.1-.3.2-.6.1c-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.2-.5.1-.2 0-.4 0-.5S9.7 7.6 9.5 7.1c-.2-.5-.3-.4-.5-.4h-.4c-.1 0-.4.1-.6.3s-.9.9-.9 2.1.9 2.5 1 2.6c.1.2 1.8 2.8 4.5 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.5-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.3A10 10 0 1 0 12 2z" />
      </svg>
      WhatsApp
    </a>
  );
}
