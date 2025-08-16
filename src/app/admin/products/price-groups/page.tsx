'use client';

import { useEffect, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';
import toast from 'react-hot-toast';

interface PriceGroup {
  id: string;
  name: string;
}

interface PackagePrice {
  id: string | null;
  price: number;
  groupId: string;
  groupName: string;
}

interface ProductPackage {
  id: string;
  name: string;
  capital: number;
  prices: PackagePrice[];
}

interface ProductResponse {
  id: string;
  name: string;
  packages: {
    id: string;
    name: string;
    capital?: number;
    prices?: PackagePrice[];
  }[];
}

export default function PriceGroupsPage() {
  const [packages, setPackages] = useState<ProductPackage[]>([]);
  const [priceGroups, setPriceGroups] = useState<PriceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // جلب كل المنتجات مع الباقات
      const pkgRes = await api.get<ProductResponse[]>(API_ROUTES.products.base);
      const allPackages: ProductPackage[] = pkgRes.data.flatMap((product) =>
        (product.packages ?? []).map((pkg) => ({
          id: pkg.id,
          name: pkg.name,
          capital: pkg.capital ?? 0,
          prices: (pkg.prices ?? []).map((p) => ({
            id: p.id ?? null,
            price: p.price ?? 0,
            groupId: p.groupId,
            groupName: p.groupName ?? '',
          })),
        }))
      );

      // جلب مجموعات الأسعار
      const groupsRes = await api.get<PriceGroup[]>(
        API_ROUTES.products.priceGroups
      );

      setPackages(allPackages);
      setPriceGroups(groupsRes.data);
      setError('');
    } catch (err) {
      console.error('خطأ في جلب البيانات:', err);
      setError('فشل في جلب البيانات من السيرفر');
    } finally {
      setLoading(false);
    }
  };

  // تعديل رأس المال محليًا
  const handleCapitalChange = (packageId: string, value: string) => {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === packageId
          ? { ...pkg, capital: value === '' ? 0 : Number(value) }
          : pkg
      )
    );
  };

  // تعديل السعر محليًا
  const handlePriceChange = (
    packageId: string,
    groupId: string,
    value: string
  ) => {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === packageId
          ? {
              ...pkg,
              prices: pkg.prices.find((p) => p.groupId === groupId)
                ? pkg.prices.map((p) =>
                    p.groupId === groupId
                      ? { ...p, price: value === '' ? 0 : Number(value) }
                      : p
                  )
                : [
                    ...pkg.prices,
                    {
                      id: null,
                      groupId,
                      groupName: '',
                      price: value === '' ? 0 : Number(value),
                    },
                  ],
            }
          : pkg
      )
    );
  };

  // حفظ باقة محددة
  const savePackagePrices = async (pkg: ProductPackage) => {
    try {
      setSavingId(pkg.id);
      await api.put(`${API_ROUTES.products.base}/packages/${pkg.id}/prices`, {
        capital: pkg.capital,
        prices: pkg.prices.map((p) => ({ groupId: p.groupId, price: p.price })),
      });
      toast.success('تم حفظ أسعار الباقة بنجاح ✅');
      fetchData(); // إعادة تحميل البيانات بعد الحفظ
    } catch (err) {
      console.error('خطأ أثناء الحفظ:', err);
      toast.error('حدث خطأ أثناء حفظ الأسعار ❌');
    } finally {
      setSavingId(null);
    }
  };

  // إضافة مجموعة أسعار
  const addPriceGroup = async () => {
    const name = prompt('أدخل اسم المجموعة الجديدة:');
    if (!name || name.trim() === '') return;

    try {
      await api.post(API_ROUTES.products.priceGroups, { name });
      toast.success('تمت إضافة المجموعة بنجاح ✅');
      fetchData();
    } catch (err) {
      console.error('خطأ أثناء إضافة المجموعة:', err);
      toast.error('فشل إضافة المجموعة ❌');
    }
  };

  // حذف مجموعة أسعار
  const deletePriceGroup = async () => {
    if (!selectedGroup) return;
    if (!confirm('هل أنت متأكد أنك تريد حذف هذه المجموعة؟')) return;

    try {
      await api.delete(`${API_ROUTES.products.priceGroups}/${selectedGroup}`);
      toast.success('تم حذف المجموعة بنجاح ✅');
      setShowDeleteModal(false);
      setSelectedGroup('');
      fetchData();
    } catch (err) {
      console.error('خطأ أثناء حذف المجموعة:', err);
      toast.error('فشل حذف المجموعة ❌');
    }
  };

  if (loading) return <div className="p-4 text-text-primary">جارٍ التحميل...</div>;
  if (error) return <div className="p-4 text-danger">{error}</div>;

  return (
    <div className="space-y-4">
      {/* أزرار الإجراءات العلوية */}
      <div className="flex items-center justify-start gap-3">
        <button onClick={addPriceGroup} className="btn btn-primary">
          + إضافة مجموعة جديدة
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="btn bg-danger text-text-inverse hover:brightness-110"
        >
          🗑 حذف مجموعة
        </button>
      </div>

      {/* مودال حذف مجموعة */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,.5)]">
          <div className="card w-80 p-6 shadow">
            <h2 className="text-lg font-bold mb-4">حذف مجموعة أسعار</h2>

            <select
              className="input w-full mb-4"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="">اختر المجموعة</option>
              {priceGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
              >
                إلغاء
              </button>
              <button
                onClick={deletePriceGroup}
                className="btn bg-danger text-text-inverse hover:brightness-110"
                disabled={!selectedGroup}
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* الجدول */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>اسم الباقة</th>
              <th>رأس المال</th>
              <th className="w-6 text-center">.</th>
              {priceGroups.map((group) => (
                <th key={group.id}>{group.name}</th>
              ))}
              <th>إجراء</th>
            </tr>
          </thead>

          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg.id} className="hover:bg-primary/5">
                <td>{pkg.name}</td>

                <td>
                  <input
                    type="number"
                    value={pkg.capital.toString()}
                    onChange={(e) => handleCapitalChange(pkg.id, e.target.value)}
                    className="input w-28"
                  />
                </td>

                <td className="bg-bg-surface-alt text-center">.</td>

                {priceGroups.map((group) => {
                  const price = pkg.prices.find((p) => p.groupId === group.id);
                  return (
                    <td key={group.id}>
                      <input
                        type="number"
                        value={price?.price?.toString() ?? ''}
                        onChange={(e) =>
                          handlePriceChange(pkg.id, group.id, e.target.value)
                        }
                        className="input w-28"
                      />
                    </td>
                  );
                })}

                <td className="text-center">
                  <button
                    onClick={() => savePackagePrices(pkg)}
                    className="btn btn-primary disabled:opacity-50"
                    disabled={savingId === pkg.id}
                  >
                    {savingId === pkg.id ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
