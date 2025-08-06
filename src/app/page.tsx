"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { API_ROUTES } from '@/utils/api';

interface Product {
  id: string;
  name: string;
  isActive: boolean;
  imageUrl?: string;
  packages?: { isActive: boolean }[];
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // host for static images
  const apiHost = API_ROUTES.products.base.replace('/api/products', '');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get<Product[]>(API_ROUTES.products.base);
        setProducts(res.data || []);
      } catch {
        setError('فشل في جلب المنتجات');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <p className="text-center mt-4">جاري تحميل المنتجات...</p>;
  if (error) return <p className="text-center text-red-600 mt-4">{error}</p>;

  // filter by search term
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-2 sm:px-4 lg:px-8">
      <h1 className="text-xl font-bold mb-4 text-right">🛍 منتجاتنا</h1>
      {/* Search bar */}
      <div className="mb-6 flex justify-end">
        <input
          type="text"
          placeholder="بحث عن منتج..."              
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-1/3 border border-gray-600 p-2 rounded bg-[#212427] hover:border-gray-100 transition"
        />
      </div>
      <div className="grid grid-cols-3 lg:grid-cols-7 gap-6">
        {filtered.map((product) => {
          const available = product.isActive && product.packages?.some(pkg => pkg.isActive);
          const imageSrc = product.imageUrl
            ? `${apiHost}${product.imageUrl}`
            : '/products/placeholder.png';

          return (
            <div
              key={product.id}
              onClick={() => router.push(`/product/${product.id}`)}
              className="bg-gray-900 text-white rounded-xl shadow-lg p-4 flex flex-col items-center hover:scale-105 hover:shadow-xl transition-transform border border-gray-700 cursor-pointer"
            >
              <img
                src={imageSrc}
                alt={product.name}
                className="w-24 h-24 object-contain rounded mb-3"
              />
              <h2 className="mt-1 text-sm text-center truncate">
                {product.name}
              </h2>
              <button
                disabled={!available}
                onClick={(e) => {
                  e.stopPropagation();
                  if (available) router.push(`/product/${product.id}`);
                }}
                className={`w-full mt-3 py-1 rounded text-white transition-colors ${
                  available
                    ? 'bg-yellow-600 hover:bg-yellow-700'
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
