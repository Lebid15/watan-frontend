"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_ROUTES } from "../../../utils/api";

interface Product {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const apiHost = API_ROUTES.products.base.replace("/api/products", "");
  const productsUrl = `${apiHost}/api/products`;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return alert("يرجى إدخال اسم المنتج");
    setAdding(true);
    try {
      // 1. إنشاء المنتج
      const createRes = await fetch(productsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!createRes.ok) throw new Error("فشل في إنشاء المنتج");
      const created: Product = await createRes.json();

      // 2. رفع الصورة إذا اختيرت
      if (newImage) {
        const formData = new FormData();
        formData.append("image", newImage);
        const uploadRes = await fetch(
          `${productsUrl}/${created.id}/image`,
          { method: "POST", body: formData }
        );
        if (!uploadRes.ok) console.error("فشل في رفع الصورة");
      }

      // 3. تحديث القائمة وإخفاء النموذج
      await fetchProducts();
      setShowForm(false);
      setNewName("");
      setNewImage(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  // تصفية حسب البحث
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[var(--bg-main)] w-full">
      {/* رأس الصفحة + بحث + إضافة */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 py-2 mb-4">
        <h1 className="text-2xl font-bold">إدارة المنتجات</h1>
        <input
          type="text"
          placeholder="بحث..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-[var(--main-color)] mt-2 md:mt-0 md:mx-4 w-full md:w-1/3 border p-2 rounded"
        />
        <button
          onClick={() => setShowForm((v) => !v)}
          className="mt-2 md:mt-0 px-4 py-2 bg-[var(--btnbg-color)] text-white rounded-lg hover:bg-[var(--btnbghover-color)]"
        >
          {showForm ? "إلغاء" : "+ إضافة منتج جديد"}
        </button>
      </div>

      {/* نموذج الإضافة */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="px-4 mb-6 p-4 rounded-lg shadow"
        >
          <div className="mb-4">
            <label className="block mb-2">اسم المنتج</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-[var(--main-color)] w-full border p-2 rounded"
              disabled={adding}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">صورة المنتج (اختياري)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files && setNewImage(e.target.files[0])
              }
              className="w-full"
              disabled={adding}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--btnbg-color)] text-white rounded hover:bg-[var(--btnbghover-color)]"
            disabled={adding}
          >
            {adding ? "جاري الإضافة..." : "حفظ"}
          </button>
        </form>
      )}

      {/* شبكة المنتجات */}
      {filtered.length === 0 ? (
        <p className="px-4 text-gray-400">لا توجد منتجات.</p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-4 px-4 py-2">
          {filtered.map((product) => {
            const available = product.isActive;
            const imageSrc = product.imageUrl
              ? `${apiHost}${product.imageUrl}`
              : '/products/placeholder.png';

            return (
              <Link
                key={product.id}
                href={available ? `/admin/products/${product.id}` : '#'}
                className={`group flex flex-col items-center select-none ${
                  available ? 'cursor-pointer' : 'opacity-40 pointer-events-none'
                }`}
                title={product.name}
              >
                {/* الأيقونة */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 shadow-md overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
                  <img
                    src={imageSrc}
                    alt={product.name}
                    className="w-3/4 h-3/4 object-contain rounded-2xl"
                    loading="lazy"
                  />
                  {/* شارة الحالة (اختياري) */}
                  {!available && (
                    <span className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white">
                      غير متوفر
                    </span>
                  )}
                </div>

                {/* الاسم */}
                <div className="mt-2 text-center text-[13px] sm:text-sm text-[var(--text-main)] truncate w-20 sm:w-24">
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
