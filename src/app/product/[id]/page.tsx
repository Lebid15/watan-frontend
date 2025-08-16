'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api, { API_ROUTES } from '@/utils/api';
import { useUser } from '../../../context/UserContext';
import { formatGroupsDots } from '@/utils/format';

// ====== الأنواع ======
interface PackagePriceItem {
  groupId: string;
  price: number;
}

interface Package {
  id: string;
  name: string;
  basePrice?: number;           // Fallback إن لم يوجد سعر للمجموعة
  isActive: boolean;
  description?: string;
  prices?: PackagePriceItem[];  // الأسعار لكل مجموعة (قادمة من الـ API)
}

interface Product {
  id: string;
  name: string;
  imageUrl?: string;
  isActive: boolean;
  packages: Package[];
  currencyCode?: string;        // عملة العرض للمستخدم (قادمة من الـ API)
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
  const { user, refreshUser } = useUser(); // لتحديث الرصيد بعد الشراء

  const [product, setProduct] = useState<Product | null>(null);
  const [currencyCode, setCurrencyCode] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [gameId, setGameId] = useState("");
  const [buying, setBuying] = useState(false);

  const apiHost = API_ROUTES.products.base.replace('/api/products','');

  // helper: يستخرج معرّف مجموعة المستخدم من الـ context
  const getUserPriceGroupId = () =>
    (user as any)?.priceGroupId ||
    (user as any)?.priceGroup?.id ||
    null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // نطلب مسار المستخدم (الأسعار محولة له مسبقًا)
        const url = `${API_ROUTES.products.base}/user/${id}`;
        const res = await api.get<Product>(url);
        setProduct(res.data);

        // العملة القادمة من الباك لها الأولوية
        setCurrencyCode(res.data?.currencyCode || (user as any)?.currencyCode || 'USD');
      } catch {
        setError('فشل في جلب بيانات المنتج');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // يحسب السعر المعروض للمستخدم لباقات المنتج
  const getPrice = (pkg: Package) => {
    const gid = getUserPriceGroupId();
    if (gid && Array.isArray(pkg.prices) && pkg.prices.length) {
      const match = pkg.prices.find(p => p.groupId === gid);
      if (match && typeof match.price === 'number') return Number(match.price);
    }
    return Number(pkg.basePrice ?? 0);
  };

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

      // تحديث الرصيد في الهيدر
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
  if (error || !product) return <p className="text-center mt-6 text-danger">{error || 'المنتج غير موجود'}</p>;

  const activePkgs = (product.packages || []).filter(p => p.isActive);
  const sym = currencySymbol(currencyCode);
  const imageSrc = product.imageUrl ? `${apiHost}${product.imageUrl}` : '/images/placeholder.png';

  return (
    <div className="p-3 text-center bg-bg-base text-text-primary">
      <h1 className="text-xl font-bold mb-3">{product.name}</h1>

      {activePkgs.length === 0 ? (
        <p className="text-text-secondary">لا توجد باقات متاحة.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activePkgs.map((pkg) => {
            const price = getPrice(pkg);
            return (
              <div
                key={pkg.id}
                onClick={() => openModal(pkg)}
                className={`flex items-center justify-between gap-3 pl-3 py-1 pr-1 rounded-xl border transition
                            bg-bg-surface border-border shadow
                            ${pkg.isActive ? 'cursor-pointer hover:bg-bg-surface-alt' : 'opacity-50 pointer-events-none'}`}
                title={pkg.name}
              >
                {/* يسار: صورة المنتج + اسم الباقة */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* الصورة تملأ المساحة بحواف دائرية */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-border bg-bg-surface shrink-0">
                    <img
                      src={imageSrc}
                      alt={pkg.name}
                      className="w-full h-full object-cover rounded-xl"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0 text-right">
                    <div className="text-sm truncate text-text-primary">{pkg.name}</div>
                    {pkg.description ? (
                      <div className="text-xs truncate text-text-secondary">{pkg.description}</div>
                    ) : null}
                  </div>
                </div>

                {/* يمين: السعر */}
                <div className="text-sm shrink-0 text-primary font-medium">
                  {formatGroupsDots(price)} {sym}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="card w-80 p-6 text-center">
            <h2 className="text-base font-bold mb-2">
              {selectedPackage.name} - {sym} {getPrice(selectedPackage).toFixed(2)}
            </h2>
            <p className="mb-4 text-text-secondary">أدخل معرف اللعبة / التطبيق</p>
            <input
              type="text"
              value={gameId}
              onChange={e => setGameId(e.target.value)}
              placeholder="هنا اكتب الايدي"
              className="input w-full mb-4 bg-bg-input border-border"
            />
            <div className="flex justify-center gap-3">
              <button
                onClick={confirmBuy}
                disabled={buying}
                className={`btn btn-primary ${buying ? 'opacity-80 cursor-wait' : ''}`}
              >
                {buying ? 'جاري الشراء...' : 'تأكيد'}
              </button>
              <button
                onClick={() => setSelectedPackage(null)}
                className="btn btn-secondary"
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
