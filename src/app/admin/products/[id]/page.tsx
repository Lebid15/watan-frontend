"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_ROUTES } from "../../../../utils/api";
import { useUser } from "@/context/UserContext";

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
  const { user } = useUser(); // يحتوي role و currencyCode لو متوفر
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // نموذج الباقات (لأدمن)
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [pkgName, setPkgName] = useState("");
  const [pkgDesc, setPkgDesc] = useState("");
  const [pkgPrice, setPkgPrice] = useState<number>(0);

  // تعديل المنتج (لأدمن)
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editActive, setEditActive] = useState(true);

  // شراء (للمستخدم)
  const [qtyByPkg, setQtyByPkg] = useState<Record<string, number>>({});
  const [buyLoading, setBuyLoading] = useState<string | null>(null); // packageId أثناء الشراء
  const [buyStatus, setBuyStatus] = useState<string | null>(null);

  const apiHost = API_ROUTES.products.base.replace("/api/products", "");

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

      // تهيئة كميات افتراضية = 1 لكل باقة
      const init: Record<string, number> = {};
      (data.packages ?? []).forEach((p) => (init[p.id] = 1));
      setQtyByPkg(init);
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

  // ====== إدارة المنتج (أدمن) ======
  const handleUpdateProduct = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      let imageUrl = product?.imageUrl;

      if (editImage) {
        const formData = new FormData();
        formData.append("image", editImage);
        const uploadRes = await fetch(`${API_ROUTES.products.base}/${id}/image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (uploadRes.ok) {
          const updated = await uploadRes.json();
          imageUrl = updated.imageUrl;
        }
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
          image: imageUrl,
          isActive: editActive,
        }),
      });
      if (!updateRes.ok) throw new Error("فشل في تعديل المنتج");
      setEditMode(false);
      fetchProduct();
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
      const res = await fetch(`${API_ROUTES.products.base}/packages/${pkgId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      fetchProduct();
    }
  };

  // ====== شراء (مستخدم) ======
  const handleBuy = async (pkgId: string) => {
    setBuyStatus(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const quantity = qtyByPkg[pkgId] ?? 1;
      if (!quantity || quantity <= 0) {
        setBuyStatus("❌ أدخل كمية صحيحة");
        return;
      }

      setBuyLoading(pkgId);
      // نرسل المنتج/الباقة/الكمية
      const res = await fetch(API_ROUTES.orders.base, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: id,
          packageId: pkgId,
          quantity,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        setBuyStatus(`❌ فشل إنشاء الطلب: ${msg || res.status}`);
        return;
      }

      const data = await res.json();
      setBuyStatus("✅ تم إنشاء الطلب بنجاح");
      // ممكن تحويل لصفحة الطلبات
      // router.push('/orders');
    } catch (e: any) {
      setBuyStatus(`❌ خطأ غير متوقع: ${e.message}`);
    } finally {
      setBuyLoading(null);
    }
  };

  if (loading) return <p className="p-4">جاري التحميل...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!product) return <p className="p-4">المنتج غير موجود</p>;

  const isAdmin = user?.role === "admin";

  return (
    <div className="p-6 bg-[var(--bg-section)] rounded shadow max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">المنتج: {product.name}</h1>

        {/* أدوات الإدارة تظهر فقط للأدمن */}
        {isAdmin && !editMode && (
          <div className="flex gap-2">
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
        )}
      </div>

      {/* تعديل المنتج (أدمن فقط) */}
      {isAdmin && editMode && (
        <div className="space-y-2 w-full mb-6">
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
            />{" "}
            فعال؟
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleUpdateProduct}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              حفظ
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {product.imageUrl && (
        <img
          src={`${apiHost}${product.imageUrl}`}
          alt={product.name}
          className="w-16 h-16 object-cover mb-6 rounded"
        />
      )}

      <h2 className="text-xl font-semibold mb-2">الباقات المتاحة</h2>

      {product.packages && product.packages.length > 0 ? (
        <ul className="space-y-3">
          {product.packages.map((pkg) => (
            <li key={pkg.id} className="flex justify-between items-center gap-3">
              <div>
                <strong>{pkg.name}</strong>{" "}
                – {pkg.basePrice} {user?.currencyCode || ""}
                {pkg.description && (
                  <p className="text-sm text-gray-400">{pkg.description}</p>
                )}
              </div>

              {/* زر شراء للمستخدمين فقط (غير الأدمن) */}
              {!isAdmin && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={qtyByPkg[pkg.id] ?? 1}
                    onChange={(e) =>
                      setQtyByPkg((prev) => ({
                        ...prev,
                        [pkg.id]: Math.max(1, Number(e.target.value) || 1),
                      }))
                    }
                    className="w-20 bg-[var(--bg-main)] border p-2 rounded text-black"
                  />
                  <button
                    type="button"
                    onClick={() => handleBuy(pkg.id)}
                    disabled={buyLoading === pkg.id}
                    className={`px-3 py-2 rounded text-white ${
                      buyLoading === pkg.id
                        ? "bg-gray-500"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {buyLoading === pkg.id ? "جارٍ الشراء..." : "شراء"}
                  </button>
                </div>
              )}

              {/* أدوات إدارة الباقة للأدمن */}
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeletePackage(pkg.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    حذف
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">لا توجد باقات لهذا المنتج حالياً</p>
      )}

      {/* إضافة باقة (أدمن فقط) */}
      {isAdmin && (
        <>
          <button
            onClick={() => setShowPackageForm((prev) => !prev)}
            className="mt-6 px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--text-section)] rounded hover:bg-[var(--btn-primary-hover-bg)]"
          >
            {showPackageForm ? "إغلاق النموذج" : "+ إضافة باقة جديدة"}
          </button>

          {showPackageForm && (
            <div className="mt-4 p-4 border rounded bg-[var(--bg-main)]">
              <input
                className="bg-[var(--bg-section)] w-full border p-2 mb-2 rounded"
                placeholder="اسم الباقة"
                value={pkgName}
                onChange={(e) => setPkgName(e.target.value)}
              />
              <textarea
                className="bg-[var(--bg-section)] w-full border p-2 mb-2 rounded"
                placeholder="الوصف (اختياري)"
                value={pkgDesc}
                onChange={(e) => setPkgDesc(e.target.value)}
              />
              <input
                type="number"
                className="bg-[var(--bg-section)] w-full border p-2 mb-2 rounded"
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
        </>
      )}

      {/* حالة الشراء */}
      {buyStatus && (
        <div
          className={`mt-4 p-2 rounded ${
            buyStatus.startsWith("✅")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {buyStatus}
        </div>
      )}
    </div>
  );
}
