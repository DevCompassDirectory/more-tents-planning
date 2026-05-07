import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	allowedDevOrigins: ['192.168.178.130'],
	devIndicators: {
		position: 'bottom-left',
	},
	experimental: {
		serverActions: {
			bodySizeLimit: '10mb',
		},
	},
};

export default nextConfig;
