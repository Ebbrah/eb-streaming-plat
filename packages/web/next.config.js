/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: false,
  },
  webpack: (config, { isServer }) => {
    // Optimize chunk loading
    config.optimization.splitChunks = {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    };
    // Add alias for @mana/shared
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@mana/shared'] = require('path').resolve(__dirname, '../shared/src');
    return config;
  },
  // Add any other Next.js configuration options here
}

module.exports = nextConfig 