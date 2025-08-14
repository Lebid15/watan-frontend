"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_ROUTES } from "@/utils/api";

interface ProductPackage {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  packages?: ProductPackage[];
}

// رفع الصورة إلى Cloudinary عبر الباك إند
async function uploadToCloudinary(file: File, token: string, apiBase: string) {
  const fd = new FormData();
  fd.append("file", file); // مهم: اسم الحقل file
  const res = await fetch(`${apiBase}/admin/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`فشل رفع الصورة إلى Cloudinary: ${res.status} ${t}`);
  }
  const data = await res.json();
  return data.url as string; // رابط Cloudinary النهائي
}

export default function AdminProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // تعديل المنتج
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editActive, setEditActive] = useState(true);

  // إضافة باقة
  const [pkgName, setPkgName] = useState("");
  const [pkgDesc, setPkgDesc] = useState("");
  const [pkgPrice, setPkgPrice] = useState<number>(0);
  const [showPackageForm, setShowPackageForm] = useState(false);

  // apiHost مثال: http://localhost:3001
  const apiHost = API_ROUTES.products.base.replace("/api/products", "");
  // apiBase: http://localhost:3001/api
  const apiBase = `${apiHost}/api`;

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_ROUTES.products.base}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("فشل في جلب بيانات المنتج");
      const data: Product = await res.json();
      setProduct(data);
      setEditName(data.name);
      setEditDesc(data.description || "");
      setEditActive(data.isActive);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdateProduct = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      if (!token) throw new Error("الرجاء تسجيل الدخول كمسؤول.");

      let imageUrl = product?.image;

      // لو اختار المستخدم صورة جديدة، نرفعها أولًا لCloudinary عبر /admin/upload
      if (editImage) {
        imageUrl = await uploadToCloudinary(editImage, token, apiBase);
      }

      const updateRes = await fetch(`${API_ROUTES.products.base}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          description: editDesc,
          image: imageUrl, // رابط Cloudinary
          isActive: editActive,
        }),
      });

      if (!updateRes.ok) throw new Error("فشل في تعديل المنتج");
      setEditImage(null);
      await fetchProduct();
      alert("تم حفظ التغييرات بنجاح");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_ROUTES.products.base}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("فشل في حذف المنتج");
      router.push("/admin/products");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddPackage = async () => {
    if (!pkgName || !pkgPrice) return alert("يرجى إدخال اسم وسعر الباقة");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_ROUTES.products.base}/${id}/packages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: pkgName,
          description: pkgDesc,
          basePrice: pkgPrice,
          isActive: true,
        }),
      });
      if (!res.ok) throw new Error("فشل في إضافة الباقة");
      setPkgName("");
      setPkgDesc("");
      setPkgPrice(0);
      setShowPackageForm(false);
      fetchProduct();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePackage = async (pkgId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الباقة؟")) return;
    try {
      const token = localStorage.getItem("token") || "";
      await fetch(`${API_ROUTES.products.base}/packages/${pkgId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProduct();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p className="p-4">جاري التحميل...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!product) return <p className="p-4">المنتج غير موجود</p>;

  return (
    <div className="p-6 bg-gray-50 rounded shadow max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">المنتج: {product.name}</h1>
        <div className="flex gap-2">
          <button
            onClick={handleUpdateProduct}
            className="px-4 py-2 bg-[var(--btn-primary-bg)] text-white rounded hover:brightness-110"
          >
            حفظ التغييرات
          </button>
          <button
            onClick={handleDeleteProduct}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            حذف المنتج
          </button>
        </div>
      </div>

      <input
        className="w-full border p-2 rounded mb-2 bg-[var(--bg-main)]"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        placeholder="اسم المنتج"
      />
      <textarea
        className="w-full border p-2 rounded mb-2"
        value={editDesc}
        onChange={(e) => setEditDesc(e.target.value)}
        placeholder="الوصف"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files && setEditImage(e.target.files[0])}
        className="mb-2"
      />
      <label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={editActive}
          onChange={(e) => setEditActive(e.target.checked)}
        />
        فعال؟
      </label>

      {product.image && (
        <img
          src={product.image.startsWith("http") ? product.image : `${apiHost}${product.image}`}
          alt={product.name}
          className="w-16 h-16 object-cover mb-6 rounded"
        />
      )}

      <h2 className="text-xl font-semibold mb-2">الباقات</h2>
      {product.packages && product.packages.length > 0 ? (
        <ul className="space-y-3">
          {product.packages.map((pkg) => (
            <li key={pkg.id} className="flex justify-between items-center gap-3">
              <div>
                <strong>{pkg.name}</strong> – {pkg.basePrice}
                {pkg.description && (
                  <p className="text-sm text-gray-400">{pkg.description}</p>
                )}
              </div>
              <button
                onClick={() => handleDeletePackage(pkg.id)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                حذف
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">لا توجد باقات</p>
      )}

      <button
        onClick={() => setShowPackageForm((prev) => !prev)}
        className="mt-6 px-4 py-2 bg-[var(--btn-primary-bg)] text-white rounded hover:bg-[var(--btn-primary-hover-bg)]"
      >
        {showPackageForm ? "إغلاق النموذج" : "+ إضافة باقة جديدة"}
      </button>

      {showPackageForm && (
        <div className="mt-4 p-4 border rounded bg-[var(--bg-main)]">
          <input
            className="w-full border p-2 mb-2 rounded"
            placeholder="اسم الباقة"
            value={pkgName}
            onChange={(e) => setPkgName(e.target.value)}
          />
          <textarea
            className="w-full border p-2 mb-2 rounded"
            placeholder="الوصف (اختياري)"
            value={pkgDesc}
            onChange={(e) => setPkgDesc(e.target.value)}
          />
          <h2>السعر</h2>
          <input
            type="number"
            className="w-full border p-2 mb-2 rounded"
            placeholder="السعر الأساسي"
            value={pkgPrice}
            onChange={(e) => setPkgPrice(parseFloat(e.target.value))}
          />
          <button
            onClick={handleAddPackage}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            حفظ الباقة
          </button>
        </div>
      )}
    </div>
  );
}
