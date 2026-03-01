'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Save, Loader2 } from 'lucide-react';
import type { Store } from '@/types/database';

export default function SettingsPage() {
  const params = useParams();
  const storeId = params.id as string;
  const supabase = createClient();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchStore() {
      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (data) setStore(data);
      setLoading(false);
    }

    fetchStore();
  }, [storeId, supabase]);

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('stores')
      .update({
        name: store.name,
        address: store.address,
        phone: store.phone,
        ipos_db_host: store.ipos_db_host,
        ipos_db_port: store.ipos_db_port,
        ipos_db_name: store.ipos_db_name,
      })
      .eq('id', storeId);

    if (error) {
      setMessage('Gagal menyimpan. Coba lagi.');
    } else {
      setMessage('Pengaturan berhasil disimpan');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="card text-center py-16">
        <p className="text-gray-500">Toko tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Pengaturan Toko</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola informasi dan konfigurasi toko</p>
      </div>

      {/* Store Info */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-800">Informasi Toko</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kode Toko</label>
          <input
            type="text"
            value={store.code}
            disabled
            className="input-field bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label>
          <input
            type="text"
            value={store.name}
            onChange={(e) => setStore({ ...store, name: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
          <textarea
            value={store.address || ''}
            onChange={(e) => setStore({ ...store, address: e.target.value })}
            rows={2}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
          <input
            type="tel"
            value={store.phone || ''}
            onChange={(e) => setStore({ ...store, phone: e.target.value })}
            className="input-field"
          />
        </div>
      </div>

      {/* iPOS Config */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-800">Konfigurasi iPOS Sync</h3>
        <p className="text-sm text-gray-500">
          Setting koneksi ke database iPOS 4 di PC kasir
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            iPOS Kode Kantor
          </label>
          <input
            type="text"
            value={store.ipos_kodekantor || ''}
            disabled
            className="input-field bg-gray-50 text-gray-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IP/Host PC Kasir
            </label>
            <input
              type="text"
              value={store.ipos_db_host || ''}
              onChange={(e) => setStore({ ...store, ipos_db_host: e.target.value })}
              placeholder="192.168.1.100"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
            <input
              type="number"
              value={store.ipos_db_port || 5432}
              onChange={(e) =>
                setStore({ ...store, ipos_db_port: parseInt(e.target.value) || 5432 })
              }
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Database iPOS
          </label>
          <input
            type="text"
            value={store.ipos_db_name || ''}
            onChange={(e) => setStore({ ...store, ipos_db_name: e.target.value })}
            placeholder="i4_tes"
            className="input-field"
          />
        </div>
      </div>

      {/* Save */}
      {message && (
        <div
          className={`text-sm px-3 py-2 rounded-lg ${
            message.includes('Gagal')
              ? 'bg-red-50 text-red-600'
              : 'bg-green-50 text-green-600'
          }`}
        >
          {message}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Simpan Pengaturan
        </button>
      </div>
    </div>
  );
}
