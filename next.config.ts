import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
  },
  // exceljs is a large CommonJS package; load it from node_modules at runtime.
  serverExternalPackages: ["exceljs"],
  experimental: {
    serverActions: {
      // Spreadsheet uploads in /admin/import (Vercel's request limit is 4.5 MB).
      bodySizeLimit: "4.5mb",
    },
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
