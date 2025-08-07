"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  imageUrl?: string;
  isActive: boolean;
  packages?: ProductPackage[];
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // إضافة باقة جديدة
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [pkgName, setPkgName] = useState("");
  const [pkgDesc, setPkgDesc] = useState("");
  const [pkgPrice, setPkgPrice] = useState<number>(0);

  // تعديل المنتج
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editActive, setEditActive] = useState(true);

  const apiHost = API_ROUTES.products.base.replace('/api/products', '');

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
  }, [id]);

  const handleUpdateProduct = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      // إذا تم اختيار صورة جديدة
      let imageUrl = product?.imageUrl;
      if (editImage) {
        const formData = new FormData();
        formData.append("image", editImage);
        const uploadRes = await fetch(
          `${API_ROUTES.products.base}/${id}/image`,
          { method: 'POST', body: formData }
        );
        if (uploadRes.ok) {
          const updated = await uploadRes.json();
          imageUrl = updated.imageUrl;
        }
      }
      // تحديث البيانات النصّية
      const updateRes = await fetch(`${API_ROUTES.products.base}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editName,
          description: editDesc,
          image: imageUrl,
          isActive: editActive,
        }),
      });
      if (!updateRes.ok) throw new Error('فشل في تعديل المنتج');
      setEditMode(false);
      fetchProduct();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(
        `${API_ROUTES.products.base}/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('فشل في حذف المنتج');
      router.push('/admin/products');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddPackage = async () => {
    if (!pkgName || !pkgPrice) return alert('يرجى إدخال اسم وسعر الباقة');
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(
        `${API_ROUTES.products.base}/${id}/packages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: pkgName,
            description: pkgDesc,
            basePrice: pkgPrice,
            isActive: true,
          }),
        }
      );
      if (!res.ok) throw new Error('فشل في إضافة الباقة');
      setPkgName(''); setPkgDesc(''); setPkgPrice(0);
      setShowPackageForm(false);
      fetchProduct();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePackage = async (pkgId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(
        `${API_ROUTES.products.base}/packages/${pkgId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('فشل في حذف الباقة');
      fetchProduct();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p className="p-4">جاري التحميل...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!product) return <p className="p-4">المنتج غير موجود</p>;

  return (
    <div className="!bg-[#0B0E13] p-6 bg-white rounded shadow max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">إدارة المنتج: {product.name}</h1>
        {!editMode ? (
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >تعديل المنتج</button>
            <button
              onClick={handleDeleteProduct}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >حذف المنتج</button>
          </div>
        ) : (
          <div className="space-y-2 w-full">
            <input
              className="w-full border p-2 rounded"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <textarea
              className="w-full border p-2 rounded"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && setEditImage(e.target.files[0])}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
              /> فعال؟
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleUpdateProduct}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >حفظ</button>
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >إلغاء</button>
            </div>
          </div>
        )}
      </div>

      {product.imageUrl && (
        <img
          src={`${apiHost}${product.imageUrl}`}
          alt={product.name}
          className="w-64 h-64 object-cover mb-6 rounded"
        />
      )}

      <h2 className="text-xl font-semibold mb-2">الباقات المتاحة</h2>
      {product.packages && product.packages.length > 0 ? (
        <ul className="space-y-3">
          {product.packages.map((pkg) => (
            <li key={pkg.id} className="flex justify-between items-center">
              <div>
                <strong>{pkg.name}</strong> – {pkg.basePrice}$
                <p className="text-sm text-gray-600">{pkg.description}</p>
              </div>
              <div className="flex gap-2">
                {/* لاحقاً يمكن إضافة Edit هنا */}
                <button
                  onClick={() => handleDeletePackage(pkg.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >حذف</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">لا توجد باقات لهذا المنتج حالياً</p>
      )}

      <button
        onClick={() => setShowPackageForm((prev) => !prev)}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {showPackageForm ? 'إغلاق النموذج' : '+ إضافة باقة جديدة'}
      </button>

      {showPackageForm && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <input
            className="w-full border p-2 mb-2 rounded"
            placeholder="اسم الباقة"
            value={pkgName}
            onChange={(e) => setPkgName(e.target.value)}
          />
          <textarea
            className="w-full border p-2 mb-2 rounded"
            placeholder="الوصف"
            value={pkgDesc}
            onChange={(e) => setPkgDesc(e.target.value)}
          />
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
          >حفظ الباقة</button>
        </div>
      )}
    </div>
  );
}