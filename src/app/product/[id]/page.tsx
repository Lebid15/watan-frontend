'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // ✅ أضفنا useRouter
import api, { API_ROUTES } from '@/utils/api';

interface PackagePrice {
  id: string;
  groupId: string;
  groupName: string;
  price: string;
}

interface Package {
  id: string;
  name: string;
  image?: string;
  basePrice?: string;
  isActive: boolean;
  prices: PackagePrice[];
}

interface Product {
  id: string;
  name: string;
  image?: string;
  packages: Package[];
}

interface UserProfile {
  id: string;
  balance: string; // رصيد المستخدم
  priceGroupId?: string | null;
}

export default function ProductDetailsPage() {
  const { id } = useParams(); 
  const router = useRouter(); // ✅
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [user, setUser] = useState<UserProfile | null>(null);
  const [buying, setBuying] = useState(false);

  // ✅ لحفظ الباقة المختارة وفتح المودال
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [gameId, setGameId] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const parsedUser = userData ? JSON.parse(userData) : null;
  const userPriceGroupId =
    (typeof window !== 'undefined' ? localStorage.getItem('userPriceGroupId') : null) ||
    parsedUser?.priceGroupId ||
    parsedUser?.price_group_id ||
    null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productRes = await api.get<Product>(`${API_ROUTES.products.base}/${id}`);
        setProduct(productRes.data);

        if (token) {
          const profileRes = await api.get<UserProfile>(API_ROUTES.users.profile, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(profileRes.data);
        }
      } catch (err) {
        setError('فشل في جلب البيانات');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, token]);

  const getPackagePrice = (pkg: Package) => {
    if (!pkg) return 0;

    if (userPriceGroupId) {
      const userPrice = pkg.prices.find(
        (p) => String(p.groupId).toLowerCase() === String(userPriceGroupId).toLowerCase()
      );
      if (userPrice) return parseFloat(userPrice.price);
    }

    return pkg.basePrice ? parseFloat(pkg.basePrice) : 0;
  };

  const handleOpenModal = (pkg: Package) => {
    if (!user) {
      alert('الرجاء تسجيل الدخول أولاً');
      return;
    }
    setSelectedPackage(pkg);
    setGameId('');
  };

  const handleConfirmBuy = async () => {
    if (!selectedPackage) return;

    const pkg = selectedPackage;
    const price = getPackagePrice(pkg);
    const balance = parseFloat(user?.balance || '0');

    if (!price || price <= 0) {
      alert('لم يتم تحديد الأسعار، الرجاء التواصل مع المشرف.');
      return;
    }

    if (balance < price) {
      alert('رصيدك غير كافٍ لإتمام العملية');
      return;
    }

    if (!gameId.trim()) {
      alert('الرجاء إدخال معرف اللعبة أو التطبيق');
      return;
    }

    try {
      setBuying(true);
      await api.post(
        API_ROUTES.orders.base,
        {
          productId: product?.id,
          packageId: pkg.id,
          quantity: 1,
          userId: user?.id,
          userIdentifier: gameId, // ✅ نرسل معرف اللعبة
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`تم إنشاء الطلب بنجاح للباقة: ${pkg.name}`);
      setSelectedPackage(null);

      // ✅ توجيه المستخدم مباشرة لصفحة الطلبات
      router.push('/orders');

    } catch (err) {
      alert('فشل في تنفيذ الطلب. تحقق من الرصيد أو اتصل بالمشرف.');
    } finally {
      setBuying(false);
    }
  };

  if (loading)
    return <p className="text-center mt-6">جاري تحميل البيانات...</p>;
  if (error || !product)
    return (
      <p className="text-center text-red-600 mt-6">
        {error || 'المنتج غير موجود'}
      </p>
    );

  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-bold mb-6">{product.name}</h1>

      {user && (
        <p className="text-yellow-500 mb-4">
          رصيدك الحالي: {parseFloat(user.balance).toFixed(2)} $
        </p>
      )}

      <div className="flex justify-center mb-6">
        <img
          src={
            product.image?.startsWith('http')
              ? product.image
              : product.image
              ? `/products/${product.image}`
              : '/products/placeholder.png'
          }
          alt={product.name}
          className="w-40 h-40 object-contain"
        />
      </div>

      {product.packages.length === 0 ? (
        <p className="text-gray-500">لا توجد باقات متاحة لهذا المنتج حالياً.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {product.packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-gray-900 text-white rounded-xl shadow-lg p-4 flex flex-col items-center 
                         hover:scale-105 transition-transform border border-gray-700"
            >
              <img
                src={
                  pkg.image?.startsWith('http')
                    ? pkg.image
                    : pkg.image
                    ? `/products/${pkg.image}`
                    : '/products/placeholder.png'
                }
                alt={pkg.name}
                className="w-24 h-24 object-contain rounded mb-2"
              />
              <h2 className="mt-1 text-sm text-center font-semibold">{pkg.name}</h2>

              <p className="text-yellow-400 mt-1">{getPackagePrice(pkg)} $</p>

              <button
                onClick={() => handleOpenModal(pkg)}
                disabled={!pkg.isActive || buying}
                className={`mt-2 w-full py-1 rounded font-semibold ${
                  pkg.isActive
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-gray-500 cursor-not-allowed text-gray-300'
                }`}
              >
                شراء
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ✅ نافذة إدخال Game ID */}
      {selectedPackage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-80 text-center">
            <h2 className="text-xl font-bold mb-4">
              أدخل معرف اللعبة / التطبيق
            </h2>
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="مثال: PUBG ID"
              className="w-full border border-gray-300 rounded p-2 mb-4 text-black"
            />
            <div className="flex justify-center gap-4">
              <button
                onClick={handleConfirmBuy}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                disabled={buying}
              >
                {buying ? 'جاري الشراء...' : 'تأكيد الشراء'}
              </button>
              <button
                onClick={() => setSelectedPackage(null)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
