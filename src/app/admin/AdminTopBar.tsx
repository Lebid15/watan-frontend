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
    <div className="relative pb-3">
      {/* سطر التنبيه */}
      {alertMessage ? (
        <div className="mr-4 py-3 px-4 pe-10 md:pe-12 
                        text-[rgb(var(--color-text-primary))] 
                        border border-[rgb(var(--color-border))] 
                        rounded-lg">
          {alertMessage}
        </div>
      ) : null}

      {/* زر الخروج في الجهة اليسار */}
      <button
        onClick={onLogout}
        className="absolute top-1.5 md:top-2 left-2 md:left-4 
                   bg-red-600 text-white p-2 rounded-xl 
                   hover:bg-red-700 transition"
        title="تسجيل الخروج"
        aria-label="تسجيل الخروج"
      >
        <FiLogOut size={20} />
      </button>
    </div>
  );
}
