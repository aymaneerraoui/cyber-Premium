function apiOrigin() {
  const url = process.env.NEXT_PUBLIC_CYBER_API_URL
  if (!url) return ''
  try {
    return new URL(url).origin
  } catch {
    return ''
  }
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' data: blob: https://cdn.discordapp.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin()}`.trim(),
  "frame-ancestors 'self'",
  "form-action 'self' https://discord.com",
  "base-uri 'self'",
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Report-only until verified against production traffic; then switch to Content-Security-Policy.
          { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
        ],
      },
    ]
  },
}

export default nextConfig
