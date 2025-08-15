"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API_ROUTES } from "@/utils/api";

interface Product {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  image?: string;       // قد يأتي من الـ API
  imageUrl?: string;    // أو قد يأتي بهذا الاسم
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [failed, setFailed] = useState<Set<string>>(new Set()); // لمنع حلقة onError

  // أمثلة:
  // apiHost = http://localhost:3001
  const apiHost = useMemo(
    () => API_ROUTES.products.base.replace(/\/api\/products\/?$/, ""),
    []
  );
  // apiBase = http://localhost:3001/api
  const apiBase = useMemo(() => `${apiHost}/api`, [apiHost]);

  const productsUrl = `${apiBase}/products`;

  const fetchProducts = async () => {
    try {
      const res = await fetch(productsUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("فشل في جلب المنتجات");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ===== منطق الصورة (Cloudinary + مسارات نسبية) =====
  function pickImageField(p: Product): string | null {
    // نعطي أولوية لـ image ثم imageUrl (مطابق لصفحة التفاصيل)
    return (p.image ?? p.imageUrl) || null;
  }

  function buildImageSrc(raw?: string | null): string {
    if (!raw) return "/products/placeholder.png";
    const s = String(raw).trim();
    if (/^https?:\/\//i.test(s)) return s;                 // URL مطلق (Cloudinary)
    if (s.startsWith("/")) return `${apiHost}${s}`;         // مسار يبدأ بـ "/"
    return `${apiHost}/${s}`;                               // مسار نسبي
  }

  function getImageSrc(p: Product): string {
    if (failed.has(p.id)) return "/products/placeholder.png";
    return buildImageSrc(pickImageField(p));
  }
  // =====================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return alert("يرجى إدخال اسم المنتج");
    setAdding(true);
    try {
      // 1) إنشاء المنتج
      const createRes = await fetch(productsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!createRes.ok) throw new Error("فشل في إنشاء المنتج");
      const created: Product = await createRes.json();

      // 2) رفع الصورة (الباك يرفع إلى Cloudinary)
      if (newImage) {
        const formData = new FormData();
        formData.append("image", newImage); // نفس اسم الحقل الذي تستخدمه
        const uploadRes = await fetch(`${productsUrl}/${created.id}/image`, {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const t = await uploadRes.text().catch(() => "");
          console.error("فشل في رفع الصورة:", t);
        }
      }

      // 3) تحديث القائمة
      await fetchProducts();
      setShowForm(false);
      setNewName("");
      setNewImage(null);
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    } finally {
      setAdding(false);
    }
  };

  // تصفية حسب البحث
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 w-full">
      {/* رأس الصفحة + بحث + إضافة — تصميم ذهبي للموبايل */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-2 md:px-4 py-2 mb-3 md:mb-4 gap-2">
        <h1 className="text-lg md:text-2xl font-bold">إدارة المنتجات</h1>

        <input
          type="text"
          placeholder="بحث..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-50 w-full md:w-1/3 border border-gray-400 rounded-xl px-3 md:px-4 py-1.5 md:py-2 text-sm md:text-base"
        />

        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 md:px-4 py-1.5 md:py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-lg hover:brightness-110 text-sm md:text-base whitespace-nowrap"
        >
          {showForm ? "إلغاء" : "+ إضافة منتج جديد"}
        </button>
      </div>

      {/* نموذج الإضافة — مدمج ومضغوط على الموبايل */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="px-2 md:px-4 mb-4 md:mb-6 p-3 md:p-4 rounded-lg shadow space-y-3"
        >
          <div>
            <label className="block mb-1 md:mb-2 text-sm md:text-base">اسم المنتج</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border rounded px-3 py-1.5 md:py-2 bg-[var(--bg-main)] text-sm md:text-base"
              disabled={adding}
            />
          </div>

          <div>
            <label className="block mb-1 md:mb-2 text-sm md:text-base">
              صورة المنتج (اختياري)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && setNewImage(e.target.files[0])}
              className="w-full text-sm md:text-base"
              disabled={adding}
            />
          </div>

          <button
            type="submit"
            className="px-3 md:px-4 py-1.5 md:py-2 bg-[var(--btnbg-color)] text-white rounded hover:bg-[var(--btnbghover-color)] text-sm md:text-base"
            disabled={adding}
          >
            {adding ? "جاري الإضافة..." : "حفظ"}
          </button>
        </form>
      )}

      {/* شبكة المنتجات — مضغوطة للموبايل، وتتوسع تدريجيًا */}
      {filtered.length === 0 ? (
        <p className="px-2 md:px-4 text-gray-400">لا توجد منتجات.</p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3 md:gap-4 px-2 md:px-4 py-2">
          {filtered.map((product) => {
            const available = product.isActive;
            const imageSrc = getImageSrc(product);

            return (
              <Link
                key={product.id}
                href={available ? `/admin/products/${product.id}` : "#"}
                className={`group flex flex-col items-center select-none ${
                  available ? "cursor-pointer" : "opacity-40 pointer-events-none"
                }`}
                title={product.name}
              >
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shadow-md overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 bg-white rounded-xl">
                  <img
                    src={imageSrc}
                    alt={product.name}
                    className="w-3/4 h-3/4 object-contain rounded-lg"
                    loading="lazy"
                    onError={() =>
                      setFailed((prev) => {
                        if (prev.has(product.id)) return prev;
                        const next = new Set(prev);
                        next.add(product.id);
                        return next;
                      })
                    }
                  />
                  {!available && (
                    <span className="absolute bottom-1 right-1 text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white">
                      غير متوفر
                    </span>
                  )}
                </div>

                <div className="mt-1.5 md:mt-2 text-center text-[11px] sm:text-[12px] md:text-sm text-[var(--text-main)] truncate w-16 sm:w-20 md:w-24">
                  {product.name}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
