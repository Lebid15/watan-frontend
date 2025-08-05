'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { API_ROUTES } from '@/utils/api';

interface Product {
  id: string;
  name: string;
  image?: string;
  price?: number;       // السعر اختياري
  isAvailable: boolean; // حالة التوفر
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get<Product[]>(API_ROUTES.products.base);
        setProducts(res.data || []);
      } catch (err) {
        setError('فشل في جلب المنتجات');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <p className="text-center mt-4">جاري تحميل المنتجات...</p>;
  if (error) return <p className="text-center text-red-600 mt-4">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-right flex items-center justify-end gap-2">
        🛍 منتجاتنا
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {/* ////////////////////////// */}
      {products.map((product: any) => {
        const imageSrc = product.image
          ? `/products/${product.image}`
          : '/products/placeholder.png';

        const available = product.isActive && product.packages?.some((pkg: any) => pkg.isActive);

        return (
          <div
            key={product.id}
            onClick={() => router.push(`/product/${product.id}`)}
            className="bg-gray-900 text-white rounded-xl shadow-lg p-4 flex flex-col items-center 
                      hover:scale-105 hover:shadow-xl transition-transform border border-gray-700 cursor-pointer"
          >
            <img
              src={imageSrc}
              alt={product.name}
              className="w-24 h-24 object-contain rounded mb-3"
            />
            <h2 className="mt-1 text-sm text-center font-semibold">{product.name}</h2>

            {product.price !== undefined && (
              <p className="text-yellow-400 mt-1">{product.price}$</p>
            )}

            <button
              disabled={!available}
              onClick={(e) => {
                e.stopPropagation();
                if (available) {
                  router.push(`/product/${product.id}`);
                }
              }}
              className={`w-full mt-3 py-1 rounded text-white font-semibold transition-colors ${
                available
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-gray-500 cursor-not-allowed'
              }`}
            >
              {available ? 'شراء' : 'غير متوفر'}
            </button>
          </div>
        );
      })}

      </div>
    </div>
  );
}
