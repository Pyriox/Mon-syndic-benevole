import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://www.google-analytics.com https://www.googletagmanager.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ');

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake lucide-react : réduit significativement la taille du bundle JS
    optimizePackageImports: ['lucide-react'],
    // Active la directive 'use cache' (Next.js 16)
    cacheComponents: true,
  },
  // Cache HTTP pour les assets statiques Next.js
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
