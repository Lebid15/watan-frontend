"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import api, { API_ROUTES } from "@/utils/api";

interface Product {
  id: string;
  name: string;
  isActive: boolean;
  image?: string | null;     // قد تكون نسبي/مطلق
  imageUrl?: string | null;  // بعض الـ APIs تُعيد هذا الحقل
  packages?: { isActive: boolean }[] | null;
}

// يبني رابط الصورة بشكل موحد:
// - إن كان مطلقًا (http/https) نعيده كما هو (Cloudinary).
// - وإلا نركّبه على apiHost مع ضمان الشرطة المبدئية.
function normalizeImageUrl(raw: string | null | undefined, apiHost: string): string {
  if (!raw) return "/images/placeholder.png";
  const s = String(raw).trim();

  // رابط مطلق (Cloudinary وغيرها)
  if (/^https?:\/\//i.test(s)) return s;

  // اضمن وجود شرطة واحدة في الوسط
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${apiHost}${path}`;
}

export default function HomePage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [failed, setFailed] = useState<Set<string>>(new Set()); // لمنع حلقة onError

  // أمّن استخراج أصل الـ API بشكل ثابت:
  // مثال: https://watan-backend.onrender.com
  const apiHost = useMemo(
    () => API_ROUTES.products.base.replace(/\/api\/products\/?$/, ""),
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Product[]>(API_ROUTES.products.base);
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        setError("فشل في جلب المنتجات");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-center mt-4">جاري تحميل المنتجات...</p>;
  if (error) return <p className="text-center text-red-600 mt-4">{error}</p>;

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-2 sm:px-4 lg:px-8">
      <h1 className="text-l mb-4 text-right">🛍 المنتجات</h1>

      {/* شريط البحث */}
      <div className="mb-6 flex justify-end">
        <input
          type="text"
          placeholder="بحث"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-[var(--bg-section)] w-full sm:w-1/3 border border-gray-600 p-2 rounded-2xl hover:border-gray-100 transition"
        />
      </div>

      {/* الشبكة */}
      <div className="grid grid-cols-4 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filtered.map((product) => {
          const available =
            product.isActive &&
            (product.packages?.some((pkg) => pkg.isActive) ?? true);

          // اختر الحقل المتاح ثم طبّق التطبيع
          const raw = product.image ?? product.imageUrl ?? null;
          const src =
            failed.has(product.id)
              ? "/images/placeholder.png"
              : normalizeImageUrl(raw, apiHost);

          return (
            <div
              key={product.id}
              onClick={() => available && router.push(`/product/${product.id}`)}
              className={`group flex flex-col items-center select-none ${
                available ? "cursor-pointer" : "opacity-40 pointer-events-none"
              }`}
              title={product.name}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={product.name}
                  className="w-5/6 h-5/6 object-contain rounded-2xl"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setFailed((prev) => {
                      if (prev.has(product.id)) return prev;
                      const next = new Set(prev);
                      next.add(product.id);
                      return next;
                    })
                  }
                />
              </div>
              <div className="text-center text-[13px] sm:text-sm text-[var(--text-main)] sm:w-24">
                {product.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
