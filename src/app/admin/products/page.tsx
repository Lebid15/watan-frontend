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
    <div className="!bg-[#0B0E13] w-full">
      {/* رأس الصفحة + بحث + إضافة */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 py-2 mb-4">
        <h1 className="text-2xl font-bold">إدارة المنتجات</h1>
        <input
          type="text"
          placeholder="بحث..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-2 md:mt-0 md:mx-4 w-full md:w-1/3 border p-2 rounded"
        />
        <button
          onClick={() => setShowForm((v) => !v)}
          className="mt-2 md:mt-0 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          {showForm ? "إلغاء" : "+ إضافة منتج جديد"}
        </button>
      </div>

      {/* نموذج الإضافة */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="px-4 mb-6 bg-white p-4 rounded-lg shadow"
        >
          <div className="mb-4">
            <label className="block mb-2">اسم المنتج</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border p-2 rounded"
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
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={adding}
          >
            {adding ? "جاري الإضافة..." : "حفظ"}
          </button>
        </form>
      )}

      {/* شبكة المنتجات */}
      {filtered.length === 0 ? (
        <p className="px-4 text-gray-500">لا توجد منتجات.</p>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 px-4">
          {filtered.map((product) => (
            <Link
              key={product.id}
              href={`/admin/products/${product.id}`}
              className="bg-white shadow-md rounded-xl p-3 flex flex-col items-center text-center hover:shadow-lg transition cursor-pointer h-44"
            >
              {product.imageUrl ? (
                <img
                  src={`${apiHost}${product.imageUrl}`}
                  alt={product.name}
                  className="w-20 h-20 object-contain rounded-md mb-2"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 flex items-center justify-center rounded-md mb-2">
                  لا صورة
                </div>
              )}
              <h3 className="text-sm font-semibold truncate">
                {product.name}
              </h3>
              <span
                className={`mt-auto px-2 py-1 text-xs rounded-full ${
                  product.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {product.isActive ? "شراء" : "غير متوفر"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
