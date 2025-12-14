
/** @type {import('next').NextConfig} */
const nextConfig = {
    // We only want Next.js for the API routes in this hybrid setup
    rewrites: async () => {
        return [
            {
                source: '/:path*',
                destination: '/:path*',
            },
        ]
    },
}

export default nextConfig;
