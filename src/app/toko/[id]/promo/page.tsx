'use client';

import { Lock } from 'lucide-react';

export default function PromoPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Promo & Diskon</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola promosi dan diskon produk</p>
      </div>

      <div className="card text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Fitur Belum Diaktifkan</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Modul Promo & Diskon sudah disiapkan skemanya (5 tipe diskon: Discount, Bundle,
          Buy X Get Y, Min Purchase, Flash Sale) dan akan diaktifkan pada fase berikutnya.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <span className="badge-info">Discount %</span>
          <span className="badge-info">Bundle</span>
          <span className="badge-info">Buy X Get Y</span>
          <span className="badge-info">Min Purchase</span>
          <span className="badge-info">Flash Sale</span>
        </div>
      </div>
    </div>
  );
}
