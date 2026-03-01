'use client';

export const dynamic = 'force-dynamic';

import { Lock } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Manajemen User</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola akun dan role pengguna</p>
      </div>

      <div className="card text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Fitur Belum Diaktifkan</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Modul Manajemen User sudah disiapkan skemanya (4 role: Direktur, General Manager,
          Supervisor, Admin Gudang) dan akan diaktifkan pada fase berikutnya. Saat ini semua
          user memiliki akses penuh (Owner mode).
        </p>
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <span className="badge-info">Direktur</span>
          <span className="badge-info">General Manager</span>
          <span className="badge-info">Supervisor</span>
          <span className="badge-info">Admin Gudang</span>
        </div>
      </div>
    </div>
  );
}
