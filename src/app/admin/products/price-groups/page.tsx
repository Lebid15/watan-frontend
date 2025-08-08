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
      const groupsRes = await api.get<PriceGroup[]>(API_ROUTES.products.priceGroups);

      setPackages(allPackages);
      setPriceGroups(groupsRes.data);
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

  if (loading) return <div className="p-4">جارٍ التحميل...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="bg-[var(--bg-main)] p-4">
      <div className="flex items-center justify-start gap-3 mb-4">
        <button
          onClick={addPriceGroup}
          className="px-4 py-2 bg-[var(--btnbg-color)] text-white rounded hover:bg-[var(--btnbghover-color)]"
        >
          + إضافة مجموعة جديدة
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          🗑 حذف مجموعة
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-80">
            <h2 className="text-lg font-bold mb-4">حذف مجموعة أسعار</h2>

            <select
              className="w-full border p-2 rounded mb-4"
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
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                إلغاء
              </button>
              <button
                onClick={deletePriceGroup}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={!selectedGroup}
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead>
            <tr className="bg-[var(--main-color)] border-b">
              <th className="border p-2">معرف الباقة</th>
              <th className="border p-2">اسم الباقة</th>
              <th className="border p-2">رأس المال</th>
              {priceGroups.map((group) => (
                <th key={group.id} className="border p-2">{group.name}</th>
              ))}
              <th className="border p-2">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg.id} className="border-b">
                <td className="border p-2">{pkg.id}</td>
                <td className="border p-2">{pkg.name}</td>
                <td className="border p-2">
                  <input
                    type="number"
                    value={pkg.capital.toString()}
                    onChange={(e) => handleCapitalChange(pkg.id, e.target.value)}
                    className="bg-[var(--main-color)] border rounded p-1 w-24"
                  />
                </td>
                {priceGroups.map((group) => {
                  const price = pkg.prices.find((p) => p.groupId === group.id);
                  return (
                    <td key={group.id} className="border p-2">
                      <input
                        type="number"
                        value={price?.price?.toString() ?? ''}
                        onChange={(e) =>
                          handlePriceChange(pkg.id, group.id, e.target.value)
                        }
                        className="bg-[var(--main-color)] border rounded p-1 w-24"
                      />
                    </td>
                  );
                })}
                <td className="border p-2 text-center">
                  <button
                    onClick={() => savePackagePrices(pkg)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
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
