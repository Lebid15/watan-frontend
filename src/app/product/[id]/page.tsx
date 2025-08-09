'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api, { API_ROUTES } from '@/utils/api';
import { useUser } from '../../../context/UserContext';
import { formatGroupsDots } from '@/utils/format';
interface Package {
  id: string;
  name: string;
  basePrice?: number; // ✅ رقم
  isActive: boolean;
  description?: string;
}

interface Product {
  id: string;
  name: string;
  imageUrl?: string;
  isActive: boolean;
  packages: Package[];
  // ✅ نجهّز حقلين ممكن يجو من الـ API
  currencyCode?: string;
}

function currencySymbol(code?: string) {
  switch (code) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'TRY': return '₺';
    case 'SAR': return '﷼';
    case 'AED': return 'د.إ';
    case 'SYP': return 'ل.س';
    case 'EGP': return '£';
    default: return code || '';
  }
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, refreshUser } = useUser(); // ✅ لتحديث الرصيد بعد الشراء
  const [product, setProduct] = useState<Product | null>(null);
  const [currencyCode, setCurrencyCode] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [gameId, setGameId] = useState("");
  const [buying, setBuying] = useState(false);

  const apiHost = API_ROUTES.products.base.replace('/api/products','');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ المهم: نطلب مسار المستخدم (الأسعار محوّلة)
        const url = `${API_ROUTES.products.base}/user/${id}`;
        const res = await api.get<Product>(url);
        setProduct(res.data);
        // currencyCode ممكن يجي من الـ API؛ لو ما جاء نfallback على UserContext
        setCurrencyCode((res.data as any)?.currencyCode || user?.currencyCode || 'USD');
      } catch {
        setError('فشل في جلب بيانات المنتج');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getPrice = (pkg: Package) => Number(pkg.basePrice ?? 0);

  const openModal = (pkg: Package) => {
    if (!pkg.isActive) return;
    setSelectedPackage(pkg);
    setGameId('');
  };

  const confirmBuy = async () => {
    if (!selectedPackage || !product) return;
    const price = getPrice(selectedPackage);
    if (!gameId.trim()) return alert('الرجاء إدخال معرف اللعبة');

    try {
      setBuying(true);
      await api.post(API_ROUTES.orders.base, {
        productId: product.id,
        packageId: selectedPackage.id,
        quantity: 1,
        userIdentifier: gameId,
      });

      // ✅ تحديث الرصيد في الهيدر
      await refreshUser();

      alert(`تم إنشاء الطلب: ${selectedPackage.name} بسعر ${currencySymbol(currencyCode)} ${price.toFixed(2)}`);
      router.push('/orders');
    } catch {
      alert('فشل في تنفيذ الطلب');
    } finally {
      setBuying(false);
    }
  };

  if (loading) return <p className="text-center mt-6">جاري التحميل...</p>;
  if (error || !product) return <p className="text-center mt-6 text-red-600">{error || 'المنتج غير موجود'}</p>;

  const activePkgs = (product.packages || []).filter(p => p.isActive);
  const sym = currencySymbol(currencyCode);

  const imageSrc = product.imageUrl ? `${apiHost}${product.imageUrl}` : '/products/placeholder.png';

  return (
    <div className="p-1 text-center">
      <h1 className="text-xl font-bold mb-2">{product.name}</h1>

      {activePkgs.length === 0 ? (
        <p className="text-gray-500">لا توجد باقات متاحة.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activePkgs.map((pkg) => {
            const price = getPrice(pkg);
            return (
              <div
                key={pkg.id}
                onClick={() => openModal(pkg)}
                className={`flex items-center justify-between gap-3 pl-3 py-1 pr-1 rounded-xl border transition
                            bg-[var(--bg-section)] border-[var(--border-color)]
                            ${pkg.isActive ? 'cursor-pointer hover:brightness-110' : 'opacity-50 pointer-events-none'}`}
                title={pkg.name}
              >
                {/* يسار: صورة المنتج + اسم الباقة */}
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={imageSrc}
                    alt={pkg.name}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                    loading="lazy"
                  />
                  <div className="min-w-0 text-right">
                    <div className="text-[var(--text-main)] text-sm font-medium truncate">{pkg.name}</div>
                    {pkg.description ? (
                      <div className="text-[var(--text-secondary)] text-xs truncate">{pkg.description}</div>
                    ) : null}
                  </div>
                </div>

                {/* يمين: السعر */}
                <div className="text-yellow-300 text-sm shrink-0">
                  {formatGroupsDots(price)} {sym} 
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPackage && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(84,94,103,0.95)] z-50">
          <div className="bg-[var(--bg-main)] rounded-lg p-6 w-80 text-center border border-l border-gray-500 ">
            <h2 className="text-l font-bold mb-2">
              {selectedPackage.name} - {sym} {getPrice(selectedPackage).toFixed(2)}
            </h2>
            <p className="mb-4">أدخل معرف اللعبة / التطبيق</p>
            <input
              type="text"
              value={gameId}
              onChange={e => setGameId(e.target.value)}
              placeholder="هنا اكتب الايدي"
              className="!bg-[var(--bg-section)] w-full border p-2 rounded mb-4 text-[var(--btn-primary-text)]"
            />
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmBuy}
                disabled={buying}
                className="bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] px-4 py-2 rounded hover:bg-[var(--btn-primary-hover-bg)]"
              >
                {buying ? 'جاري الشراء...' : 'تأكيد'}
              </button>
              <button
                onClick={() => setSelectedPackage(null)}
                className="bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] px-4 py-2 rounded hover:bg-[var(--btn-secondary-hover-bg)]"
              >إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
