'use client';

import {
  HelpCircle,
  ScanLine,
  ShoppingCart,
  Package,
  FileText,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

interface GuideSection {
  title: string;
  icon: React.ElementType;
  steps: string[];
}

const guides: GuideSection[] = [
  {
    title: 'Cek Stok & Scan Barcode',
    icon: ScanLine,
    steps: [
      'Buka menu "Cek Stok" di sidebar',
      'Tekan tombol "Scan Barcode" untuk membuka kamera',
      'Arahkan kamera ke barcode produk',
      'Sistem akan otomatis menampilkan data produk (stok, harga, supplier)',
      'Masukkan jumlah stok fisik yang dihitung',
      'Sistem akan menghitung selisih otomatis',
      'Setelah selesai scan, tekan "Transfer ke Pesanan" untuk produk yang perlu dipesan',
    ],
  },
  {
    title: 'Membuat Pesanan',
    icon: ShoppingCart,
    steps: [
      'Pesanan otomatis dibuat dari halaman Cek Stok (Transfer ke Pesanan)',
      'Atau buat manual dari halaman Master Produk',
      'Pesanan akan dikelompokkan per supplier',
      'Buka menu "Rekap Supplier" untuk melihat ringkasan',
      'Kirim pesanan via WhatsApp atau Email dari halaman Rekap',
      'Status pesanan: Draft → Dipesan → Sebagian Diterima → Selesai',
    ],
  },
  {
    title: 'Menerima Barang',
    icon: Package,
    steps: [
      'Buka menu "Pesanan" di sidebar',
      'Cari pesanan yang barangnya sudah datang',
      'Klik pesanan untuk melihat detail item',
      'Masukkan jumlah barang yang diterima untuk setiap item',
      'Tekan "Terima" untuk mengkonfirmasi setiap item',
      'Stok akan otomatis terupdate di sistem',
      'Setelah semua item diterima, tekan "Selesaikan Pesanan"',
    ],
  },
  {
    title: 'Rekap & Kirim ke Supplier',
    icon: FileText,
    steps: [
      'Buka menu "Rekap Supplier"',
      'Sistem akan menampilkan ringkasan pesanan per supplier',
      'Tekan "Kirim WA" untuk mengirim via WhatsApp',
      'Tekan "Email" untuk mengirim via email',
      'Tekan "PDF" untuk mengunduh dalam format PDF',
    ],
  },
  {
    title: 'Melihat Penjualan',
    icon: BarChart3,
    steps: [
      'Data penjualan diambil otomatis dari iPOS melalui sync agent',
      'Buka menu "Penjualan" untuk melihat data harian',
      'Gunakan filter tanggal untuk melihat periode tertentu',
      'Dashboard menampilkan ringkasan penjualan hari ini',
    ],
  },
  {
    title: 'Sync iPOS',
    icon: RefreshCw,
    steps: [
      'Sync berjalan otomatis saat PC kasir dinyalakan',
      'Python sync agent akan berjalan di background',
      'Data yang disync: produk, stok, penjualan',
      'Pantau status sync di menu "Sync Monitor"',
      'Jika ada masalah, hubungi administrator',
    ],
  },
];

export default function PanduanPage() {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Panduan Penggunaan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Cara menggunakan aplikasi Inventaris Multi-Toko
        </p>
      </div>

      <div className="space-y-2">
        {guides.map((guide, index) => {
          const Icon = guide.icon;
          const isExpanded = expanded === index;

          return (
            <div key={index} className="card p-0 overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : index)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800">{guide.title}</h3>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  <ol className="space-y-2 ml-14">
                    {guide.steps.map((step, stepIdx) => (
                      <li key={stepIdx} className="flex gap-2 text-sm text-gray-600">
                        <span className="font-semibold text-blue-600 shrink-0">
                          {stepIdx + 1}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Help */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800">Butuh Bantuan?</h3>
            <p className="text-sm text-blue-600 mt-1">
              Hubungi administrator jika mengalami kendala dalam menggunakan aplikasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
