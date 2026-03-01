'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  History,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react';
import { formatRupiah, formatDateShort } from '@/lib/utils';

interface OrderRow {
  id: string;
  do_number: string;
  order_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  supplier?: { id: string; code: string; name: string } | { id: string; code: string; name: string }[];
  items?: OrderItemRow[] | OrderItemRow;
}

interface OrderItemRow {
  id: string;
  qty_ordered: number;
  qty_received: number;
  hpp_at_order: number | null;
  status: string;
  received_at: string | null;
  store_product?: { id: string; barcode: string; name: string; unit: string; hpp: number; sell_price: number }
    | { id: string; barcode: string; name: string; unit: string; hpp: number; sell_price: number }[];
}

interface NormalizedOrder {
  id: string;
  do_number: string;
  order_date: string;
  status: string;
  notes: string | null;
  updated_at: string;
  supplierName: string;
  items: NormalizedItem[];
}

interface NormalizedItem {
  id: string;
  productName: string;
  barcode: string;
  unit: string;
  qty_ordered: number;
  qty_received: number;
  hpp: number;
  status: string;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'badge-info' },
  ordered: { label: 'Dipesan', cls: 'badge-warning' },
  partial: { label: 'Sebagian', cls: 'badge-warning' },
  complete: { label: 'Selesai', cls: 'badge-success' },
  cancelled: { label: 'Dibatalkan', cls: 'badge-danger' },
};

export default function HistoryPage() {
  const params = useParams();
  const storeId = params.id as string;
  const supabase = createClient();
  const [orders, setOrders] = useState<NormalizedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          supplier:suppliers(id, code, name),
          items:order_items(
            *,
            store_product:store_products(id, barcode, name, unit, hpp, sell_price)
          )
        `)
        .eq('store_id', storeId)
        .in('status', ['complete', 'cancelled'])
        .order('updated_at', { ascending: false });

      if (dateFrom) {
        query = query.gte('order_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('order_date', dateTo);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('Error fetching history:', error);
        setLoading(false);
        return;
      }

      // Normalize relations
      const normalized: NormalizedOrder[] = (data || []).map((raw: OrderRow) => {
        const sup = Array.isArray(raw.supplier) ? raw.supplier[0] : raw.supplier;
        const rawItems = Array.isArray(raw.items) ? raw.items : raw.items ? [raw.items] : [];

        const items: NormalizedItem[] = rawItems.map((item: OrderItemRow) => {
          const sp = Array.isArray(item.store_product) ? item.store_product[0] : item.store_product;
          return {
            id: item.id,
            productName: sp?.name || '-',
            barcode: sp?.barcode || '-',
            unit: sp?.unit || '-',
            qty_ordered: item.qty_ordered,
            qty_received: item.qty_received,
            hpp: item.hpp_at_order || sp?.hpp || 0,
            status: item.status,
          };
        });

        return {
          id: raw.id,
          do_number: raw.do_number,
          order_date: raw.order_date,
          status: raw.status,
          notes: raw.notes,
          updated_at: raw.updated_at,
          supplierName: sup?.name || '-',
          items,
        };
      });

      setOrders(normalized);
      setLoading(false);
    }

    fetchHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, dateFrom, dateTo]);

  const filteredOrders = orders.filter(
    (o) =>
      o.do_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">History Pemesanan</h1>
        <p className="text-sm text-gray-500 mt-1">Arsip pesanan yang sudah selesai</p>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari DO number atau supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input-field w-auto text-sm"
            placeholder="Dari"
          />
          <span className="text-gray-400 text-sm">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input-field w-auto text-sm"
            placeholder="Sampai"
          />
        </div>
      </div>

      {/* Summary */}
      {filteredOrders.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center py-3">
            <p className="text-xs text-gray-500">Total Pesanan</p>
            <p className="text-lg font-bold text-gray-800">{filteredOrders.length}</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-xs text-gray-500">Selesai</p>
            <p className="text-lg font-bold text-green-600">
              {filteredOrders.filter(o => o.status === 'complete').length}
            </p>
          </div>
          <div className="card text-center py-3">
            <p className="text-xs text-gray-500">Total Nilai</p>
            <p className="text-lg font-bold text-gray-800">
              {formatRupiah(filteredOrders.reduce((sum, o) =>
                sum + o.items.reduce((s, i) => s + i.qty_received * i.hpp, 0), 0
              ))}
            </p>
          </div>
        </div>
      )}

      {/* History List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card text-center py-16">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Belum ada history</p>
          <p className="text-sm text-gray-400 mt-1">
            Pesanan yang selesai akan muncul di sini
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.complete;
            const totalValue = order.items.reduce(
              (sum, item) => sum + item.qty_received * item.hpp,
              0
            );

            return (
              <div key={order.id} className="card p-0 overflow-hidden">
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 font-mono text-sm">
                          {order.do_number}
                        </span>
                        <span className={statusInfo.cls}>{statusInfo.label}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{order.supplierName}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>{formatDateShort(order.order_date)}</span>
                        <span>{order.items.length} item</span>
                        <span>{formatRupiah(totalValue)}</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="table-header">
                          <th className="px-3 py-2">Produk</th>
                          <th className="px-3 py-2">Barcode</th>
                          <th className="px-3 py-2 text-right">Qty Pesan</th>
                          <th className="px-3 py-2 text-right">Qty Diterima</th>
                          <th className="px-3 py-2 text-right">HPP</th>
                          <th className="px-3 py-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="table-cell font-medium text-sm">{item.productName}</td>
                            <td className="table-cell font-mono text-xs text-gray-500">{item.barcode}</td>
                            <td className="table-cell text-right">{item.qty_ordered}</td>
                            <td className="table-cell text-right font-medium">{item.qty_received}</td>
                            <td className="table-cell text-right text-sm">{formatRupiah(item.hpp)}</td>
                            <td className="table-cell text-right font-medium">
                              {formatRupiah(item.qty_received * item.hpp)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                          <td colSpan={3} className="px-3 py-2 text-sm text-right">Total:</td>
                          <td className="px-3 py-2 text-right text-sm">
                            {order.items.reduce((s, i) => s + i.qty_received, 0)}
                          </td>
                          <td className="px-3 py-2"></td>
                          <td className="px-3 py-2 text-right text-sm">{formatRupiah(totalValue)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
