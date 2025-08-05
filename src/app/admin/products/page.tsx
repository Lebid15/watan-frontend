"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link"; // ✅ لإضافة رابط قابل للنقر
import { API_ROUTES } from "../../../utils/api"; 

interface Product {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  image?: string;
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_ROUTES.products.base);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async () => {
    const name = prompt("أدخل اسم المنتج:");
    if (!name) return;

    try {
      const res = await fetch(API_ROUTES.products.base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        fetchProducts();
      } else {
        console.error("Failed to add product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">إدارة المنتجات</h1>
        <button
          onClick={handleAddProduct}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + إضافة منتج جديد
        </button>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-500">لا توجد منتجات بعد.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/admin/products/${product.id}`} // ✅ يوجه لصفحة التفاصيل
              className="bg-white shadow-md rounded-xl overflow-hidden p-3 flex flex-col items-center text-center hover:shadow-lg transition cursor-pointer"
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={100}
                  height={100}
                  className="rounded-md"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 flex items-center justify-center rounded-md">
                  لا صورة
                </div>
              )}
              <h3 className="mt-2 font-semibold">{product.name}</h3>
              <p className="text-gray-500 text-sm mt-1">
                {product.createdAt
                  ? new Date(product.createdAt).toLocaleDateString()
                  : "بدون تاريخ"}
              </p>
              <span
                className={`mt-2 px-3 py-1 text-sm rounded-full ${
                  product.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {product.isActive ? "نشط" : "موقوف"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
