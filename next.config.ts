import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	allowedDevOrigins: ['192.168.178.130'],
	devIndicators: {
		position: 'bottom-left',
	},
};

export default nextConfig;
