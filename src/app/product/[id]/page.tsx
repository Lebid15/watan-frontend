'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api, { API_ROUTES } from '@/utils/api';
import { useUser } from '../../../context/UserContext';

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
  const { refreshUser } = useUser(); // ✅ لاستخدام تحديث الرصيد بعد الطلب

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

      // ✅ تحديث بيانات المستخدم (الرصيد) من السياق
      await refreshUser();

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

  const activePkgs = product.packages.filter(p => p.isActive);

  return (
    <div className="p-1 text-center">
      <h1 className="text-xl font-bold mb-2">{product.name}</h1>

      {activePkgs.length === 0 ? (
        <p className="text-gray-500">لا توجد باقات متاحة.</p>
      ) : (
        <div className="grid grid-cols-3 lg:grid-cols-7 gap-3">
          {activePkgs.map(pkg => {
            const imageSrc = product.imageUrl ? `${apiHost}${product.imageUrl}` : '/products/placeholder.png';
            return (
              <div
                key={pkg.id}
                className="bg-[var(--main-color)] text-white rounded-xl shadow-lg flex flex-col items-center hover:scale-105 hover:shadow-xl transition-transform cursor-pointer"
                onClick={() => openModal(pkg)}
              >
                <img
                  src={imageSrc}
                  alt={pkg.name}
                  className="w-full h-24 object-cover  rounded var(--secondary-color)"
                />
                <h2 className="bg-[var(--main-color)] mt-1 text-sm">{pkg.name}</h2>
                <p className="bg-[var(--main-color)] text-yellow-400 mt-1">{getPrice(pkg)} $</p>
              </div>
            );
          })}
        </div>
      )}

      {selectedPackage && (
        <div className="fixed inset-0 flex items-center justify-center !bg-opacity-95 z-50">
          <div className="bg-[var(--main-color)] rounded-lg p-6 w-80 text-center border border-l border-gray-500">
            <h2 className="text-l font-bold mb-2">
              {selectedPackage.name} - {getPrice(selectedPackage)} $
            </h2>
            <p className="mb-4">أدخل معرف اللعبة / التطبيق</p>
            <input
              type="text"
              value={gameId}
              onChange={e => setGameId(e.target.value)}
              placeholder="هنا اكتب الايدي"
              className="!bg-[var(--second-color)] w-full border p-2 rounded mb-4 text-gray-950"
            />
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmBuy}
                disabled={buying}
                className="bg-[var(--btnbg-color)] text-white px-4 py-2 rounded hover:bg-green-600"
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
