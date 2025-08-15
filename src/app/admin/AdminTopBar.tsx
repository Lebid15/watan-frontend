'use client';

import { FiLogOut } from 'react-icons/fi';

export default function AdminTopBar({
  alertMessage,
  onLogout,
}: {
  alertMessage?: string;
  onLogout: () => void;
}) {
  return (
    <div className="relative pb-4">
      {/* سطر التنبيه */}
      {alertMessage ? (
        <div className="text-gray-200 mr-5 py-2 px-4 pe-10 md:pe-12">
          {alertMessage}
        </div>
      ) : null}

      {/* زر الخروج في الجهة اليسار */}
      <button
        onClick={onLogout}
        className="absolute top-1.5 md:top-2 left-2 md:left-4 bg-red-600 text-white p-2 rounded-xl hover:bg-red-700 transition"
        title="تسجيل الخروج"
        aria-label="تسجيل الخروج"
      >
        <FiLogOut size={18} />
      </button>
    </div>
  );
}
