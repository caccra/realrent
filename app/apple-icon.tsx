import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        <svg width="132" height="132" viewBox="0 0 64 64" fill="none">
          <path d="M17 30L32 17L47 30" stroke="#F6F4EE" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="32" cy="36" r="6.5" fill="#E8804A" />
          <path d="M28.6 40.5L35.4 40.5L33.6 48L30.4 48Z" fill="#E8804A" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
