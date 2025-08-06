"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api, { API_ROUTES } from '@/utils/api';

interface Package {
  id: string;
  name: string;
  basePrice?: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  imageUrl?: string;
  isActive: boolean;
  packages: Package[];
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [gameId, setGameId] = useState("");
  const [buying, setBuying] = useState(false);

  const apiHost = API_ROUTES.products.base.replace('/api/products','');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<Product>(`${API_ROUTES.products.base}/${id}`);
        setProduct(res.data);
      } catch {
        setError('فشل في جلب بيانات المنتج');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const getPrice = (pkg: Package) => parseFloat(pkg.basePrice || '0');

  const openModal = (pkg: Package) => {
    if (!pkg.isActive) return;
    setSelectedPackage(pkg);
    setGameId('');
  };

  const confirmBuy = async () => {
    if (!selectedPackage) return;
    const price = getPrice(selectedPackage);
    if (!gameId.trim()) return alert('الرجاء إدخال معرف اللعبة');
    try {
      setBuying(true);
      await api.post(API_ROUTES.orders.base, {
        productId: product?.id,
        packageId: selectedPackage.id,
        quantity: 1,
        userIdentifier: gameId,
      });
      alert(`تم إنشاء الطلب: ${selectedPackage.name} بسعر ${price} $`);
      router.push('/orders');
    } catch {
      alert('فشل في تنفيذ الطلب');
    } finally {
      setBuying(false);
    }
  };

  if (loading) return <p className="text-center mt-6">جاري التحميل...</p>;
  if (error || !product) return <p className="text-center mt-6 text-red-600">{error || 'المنتج غير موجود'}</p>;

  // filter active packages
  const activePkgs = product.packages.filter(p => p.isActive);

  return (
    <div className="p-4 text-center">
      <h1 className="text-xl font-bold mb-6">{product.name}</h1>

      {activePkgs.length === 0 ? (
        <p className="text-gray-500">لا توجد باقات متاحة.</p>
      ) : (
        <div className="grid grid-cols-3 lg:grid-cols-7 gap-6">
          {activePkgs.map(pkg => {
            const imageSrc = product.imageUrl ? `${apiHost}${product.imageUrl}` : '/products/placeholder.png';
            return (
              <div
                key={pkg.id}
                className="bg-gray-900 text-white rounded-xl shadow-lg p-4 flex flex-col items-center hover:scale-105 hover:shadow-xl transition-transform cursor-pointer"
                onClick={() => openModal(pkg)}
              >
                <img
                  src={imageSrc}
                  alt={pkg.name}
                  className="w-24 h-24 object-contain rounded mb-2"
                />
                <h2 className="mt-1 text-sm truncate">{pkg.name}</h2>
                <p className="text-yellow-400 mt-1">{getPrice(pkg)} $</p>
              </div>
            );
          })}
        </div>
      )}

      {selectedPackage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="rounded-lg p-6 w-80 text-center bg-[#1b2230]">
            <h2 className="text-l font-bold mb-2">
              {selectedPackage.name} - {getPrice(selectedPackage)} $
            </h2>
            <p className="mb-4">أدخل معرف اللعبة / التطبيق</p>
            <input
              type="text"
              value={gameId}
              onChange={e => setGameId(e.target.value)}
              placeholder="هنا اكتب الايدي"
              className="w-full border p-2 rounded mb-4 text-gray-950"
            />
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmBuy}
                disabled={buying}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                {buying ? 'جاري الشراء...' : 'تأكيد'}
              </button>
              <button
                onClick={() => setSelectedPackage(null)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
