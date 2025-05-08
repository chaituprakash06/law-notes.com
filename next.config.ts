/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'zqdiweglvrgyyfjkfz.supabase.co', // Your Supabase storage domain from the error message
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig