/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('better-sqlite3');
      config.externals.push('node-cron');
    }
    return config;
  },
};

export default nextConfig;
