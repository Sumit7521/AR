/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "tamest-ernest-nonattacking.ngrok-free.dev",
    "*.ngrok-free.dev",
    "*.ngrok.io",
    "*.ngrok-free.app",
    "localhost:3000",
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "ngrok-skip-browser-warning", value: "true" },
        ],
      },
    ];
  },
};

export default nextConfig;
