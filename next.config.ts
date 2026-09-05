import type { NextConfig } from "next";
import { optimizedImageHosts, supabaseImageHost } from "./src/lib/image-hosts";
import { IMAGE_QUALITIES } from "./src/lib/image-quality";

const supabaseHost = supabaseImageHost();

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/blog/:slug.md",
        destination: "/blog/:slug/markdown",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "Link",
            value: '</llms.txt>; rel="describedby"',
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  images: {
    // Dev-only: some local DNS (VPN/NAT64) makes Supabase look like a private
    // IP, and Next 16's image optimizer then 400s. Leave this off in production.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    formats: ["image/avif", "image/webp"],
    qualities: IMAGE_QUALITIES,
    // Derived from src/lib/image-hosts.ts so this list and the runtime check
    // in post-cover.tsx can never drift apart.
    remotePatterns: optimizedImageHosts().map((hostname) => ({
      protocol: "https" as const,
      hostname,
      // Supabase Storage only ever serves public objects from this prefix.
      pathname:
        hostname === supabaseHost ? "/storage/v1/object/public/**" : "/**",
    })),
  },
};

export default nextConfig;
