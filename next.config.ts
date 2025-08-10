import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // يتجاهل أخطاء ESLint أثناء البناء
  eslint: {
    ignoreDuringBuilds: true,
  },

  // إخفاء أيقونة حرف N أثناء التطوير
  devIndicators: {
    buildActivity: false,
  },

  /* أي إعدادات أخرى لديك */
};

export default nextConfig;
