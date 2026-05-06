/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['isncsci-ui'],
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'rehabmetricsiq.com',
          },
        ],
        destination: 'https://www.rehabmetricsiq.com/:path*',
        permanent: true,
      },
    ]
  },
}
module.exports = nextConfig
