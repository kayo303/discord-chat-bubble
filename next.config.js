/** @type {import('next').NextConfig} */
const repoBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: repoBasePath,
  assetPrefix: repoBasePath,
  images: { unoptimized: true },
};

module.exports = nextConfig;
