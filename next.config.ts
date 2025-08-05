import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // يتجاهل أخطاء ESLint أثناء البناء
  eslint: {
    ignoreDuringBuilds: true,
  },

  /* أي إعدادات أخرى لديك */
};

export default nextConfig;
