"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { API_ROUTES } from "../../../../utils/api";

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

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // لإضافة باقة جديدة
  const [showForm, setShowForm] = useState(false);
  const [pkgName, setPkgName] = useState("");
  const [pkgDesc, setPkgDesc] = useState("");
  const [pkgPrice, setPkgPrice] = useState<number>(0);

  // لتعديل المنتج
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editActive, setEditActive] = useState(true);

  const fetchProduct = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_ROUTES.products.base}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("فشل في جلب بيانات المنتج");

      const data = await res.json();
      setProduct(data);

      // تحديث حقول التعديل
      setEditName(data.name);
      setEditDesc(data.description || "");
      setEditImage(data.image || "");
      setEditActive(data.isActive);
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const handleAddPackage = async () => {
    if (!pkgName || !pkgPrice) return alert("أدخل اسم وسعر الباقة");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_ROUTES.products.base}/${id}/packages`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: pkgName,
          description: pkgDesc,
          basePrice: pkgPrice,
          isActive: true,
        }),
      });

      if (!res.ok) throw new Error("فشل في إضافة الباقة");
      await fetchProduct();
      setPkgName("");
      setPkgDesc("");
      setPkgPrice(0);
      setShowForm(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الباقة؟")) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_ROUTES.products.base}/packages/${packageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("فشل في حذف الباقة");
      await fetchProduct();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateProduct = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_ROUTES.products.base}/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          description: editDesc,
          image: editImage,
          isActive: editActive,
        }),
      });
      if (!res.ok) throw new Error("فشل في تعديل المنتج");
      await fetchProduct();
      setEditMode(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج نهائيًا؟")) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_ROUTES.products.base}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("فشل في حذف المنتج");
      alert("تم حذف المنتج بنجاح");
      router.push("/admin/products");
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p className="p-4">جاري التحميل...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!product) return <p className="p-4">المنتج غير موجود</p>;

  return (
    <div className="p-6 bg-white shadow rounded max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">إدارة المنتج: {product.name}</h1>

      {product.image && (
        <img
          src={product.image}
          alt={product.name}
          className="w-64 h-64 object-cover mb-4 rounded"
        />
      )}

      {!editMode ? (
        <>
          <p className="mb-2">الوصف: {product.description || "لا يوجد وصف"}</p>
          <p className="mb-2">الحالة: {product.isActive ? "مفعل" : "معطل"}</p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              تعديل المنتج
            </button>
            <button
              onClick={handleDeleteProduct}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              حذف المنتج
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <input
            className="border p-2 w-full mb-2 rounded"
            placeholder="اسم المنتج"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <input
            className="border p-2 w-full mb-2 rounded"
            placeholder="رابط الصورة"
            value={editImage}
            onChange={(e) => setEditImage(e.target.value)}
          />
          <textarea
            className="border p-2 w-full mb-2 rounded"
            placeholder="الوصف"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
          />
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={editActive}
              onChange={(e) => setEditActive(e.target.checked)}
            />
            مفعل؟
          </label>
          <button
            onClick={handleUpdateProduct}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            حفظ التعديلات
          </button>
        </div>
      )}

      <h2 className="text-xl font-semibold mt-6 mb-2">الباقات المتاحة</h2>
      {product.packages && product.packages.length > 0 ? (
        <ul className="list-disc pl-6">
          {product.packages.map((pkg) => (
            <li key={pkg.id} className="mb-2">
              <div className="flex justify-between items-center">
                <div>
                  <strong>{pkg.name}</strong> - {pkg.basePrice}$
                  <p className="text-gray-600">{pkg.description || "لا يوجد وصف"}</p>
                </div>
                <button
                  onClick={() => handleDeletePackage(pkg.id)}
                  className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">لا توجد باقات لهذا المنتج حالياً</p>
      )}

      {/* زر إضافة باقة */}
      <button
        onClick={() => setShowForm((prev) => !prev)}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {showForm ? "إغلاق النموذج" : "+ إضافة باقة جديدة"}
      </button>

      {showForm && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <input
            className="border p-2 w-full mb-2 rounded"
            placeholder="اسم الباقة"
            value={pkgName}
            onChange={(e) => setPkgName(e.target.value)}
          />
          <input
            className="border p-2 w-full mb-2 rounded"
            placeholder="الوصف"
            value={pkgDesc}
            onChange={(e) => setPkgDesc(e.target.value)}
          />
          <input
            type="number"
            className="border p-2 w-full mb-2 rounded"
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
