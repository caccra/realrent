import { ImageResponse } from "next/og";

export const alt = "Kezavi — property management for Uganda";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1B4D3A",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              width: 96,
              height: 96,
              borderRadius: 22,
              background: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
              <path d="M17 30L32 17L47 30" stroke="#F6F4EE" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="32" cy="36" r="6.5" fill="#E8804A" />
              <path d="M28.6 40.5L35.4 40.5L33.6 48L30.4 48Z" fill="#E8804A" />
            </svg>
          </div>
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>kezavi</div>
        <div style={{ fontSize: 32, marginTop: 16, color: "#E3EEE7" }}>
          Digital leases, rent tracking, and payments for Uganda
        </div>
      </div>
    ),
    { ...size }
  );
}
