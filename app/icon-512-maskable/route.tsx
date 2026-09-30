import { ImageResponse } from "next/og";

// Maskable variant: Android crops this to a circle/squircle/rounded-square
// depending on the device's icon shape, so the background must be edge to
// edge with no padding, and the mark itself kept well inside the ~80% safe
// zone so nothing meaningful gets clipped by the mask.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1B4D3A",
        }}
      >
        <svg width="280" height="280" viewBox="0 0 64 64" fill="none">
          <path d="M17 30L32 17L47 30" stroke="#F6F4EE" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="32" cy="36" r="6.5" fill="#E8804A" />
          <path d="M28.6 40.5L35.4 40.5L33.6 48L30.4 48Z" fill="#E8804A" />
        </svg>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
