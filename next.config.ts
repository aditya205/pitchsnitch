import type { NextConfig } from "next";

const localNetworkHostnames = ["192.168.1.4"];
const localNetworkActionOrigins = [
  ...localNetworkHostnames,
  ...localNetworkHostnames.map((host) => `${host}:3000`),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: localNetworkHostnames,
  experimental: {
    serverActions: {
      allowedOrigins: localNetworkActionOrigins,
    },
  },
};

export default nextConfig;
