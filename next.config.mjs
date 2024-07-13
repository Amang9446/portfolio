/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'pics.craiyon.com',
          port: '',
          pathname: '/**',
        },
      ],
    },
  };
  
  export default nextConfig;
  