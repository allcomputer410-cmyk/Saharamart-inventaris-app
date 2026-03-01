'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ShoppingCart,
  Search,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { formatRupiah, formatDateShort, generateDoNumber } from '@/lib/utils';
import type { Order } from '@/types/database';

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  pending: { label: 'Menunggu', class: 'badge-info' },
  draft: { label: 'Draft', class: 'badge-info' },
  ordered: { label: 'Dipesan', class: 'badge-warning' },
  partial: { label: 'Sebagian', class: 'badge-warning' },
  complete: { label: 'Selesai', class: 'badge-success' },
  received: { label: 'Diterima', class: 'badge-success' },
  cancelled: { label: 'Dibatalkan', class: 'badge-danger' },
};

interface PendingItem {
  store_product_id: string;
  barcode: string;
  name: string;
  unit: string | null;
  hpp: number;
  qty_to_order: number;
  supplier_id: string | null;
  supplier_name: string;
}

export default function PesananPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = params.id as string;
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load items from cek-stok
  useEffect(() => {
    if (searchParams.get('from') === 'cek-stok') {
      const stored = sessionStorage.getItem(`pesanan_items_${storeId}`);
      if (stored) {
        try {
          const items = JSON.parse(stored) as PendingItem[];
          setPendingItems(items);
          setShowCreateForm(true);
          sessionStorage.removeItem(`pesanan_items_${storeId}`);
        } catch { /* ignore */ }
      }
    }
  }, [searchParams, storeId]);

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select(`
        *,
        supplier:suppliers(id, code, name, phone),
        items:order_items(
          *,
          store_product:store_products(id, barcode, name, unit, hpp, sell_price)
        )
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (filterStatus === 'active') {
      query = query.in('status', ['draft', 'ordered', 'partial']);
    } else if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      // Normalize supplier relations
      const normalized = (data || []).map((order) => {
        const sup = Array.isArray(order.supplier) ? order.supplier[0] : order.supplier;
        const items = (order.items || []).map((item: Record<string, unknown>) => {
          const sp = Array.isArray(item.store_product) ? item.store_product[0] : item.store_product;
          return { ...item, store_product: sp };
        });
        return { ...order, supplier: sup, items };
      });
      setOrders(normalized as Order[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, filterStatus]);

  const filteredOrders = orders.filter(
    (o) =>
      o.do_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Confirm receive item + update stock + record movement + audit
  const handleConfirmItem = async (orderId: string, itemId: string, qtyReceived: number, storeProductId: string) => {
    setActionLoading(itemId);

    // Get current stock
    const { data: stockData } = await supabase
      .from('stock')
      .select('id, current_qty')
      .eq('store_id', storeId)
      .eq('store_product_id', storeProductId)
      .single();

    const oldQty = stockData?.current_qty || 0;
    const newQty = oldQty + qtyReceived;

    // Update order item
    const { error } = await supabase
      .from('order_items')
      .update({
        qty_received: qtyReceived,
        status: 'received',
        received_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    if (error) {
      console.error('Error confirming item:', error);
      setActionLoading(null);
      return;
    }

    // Update stock (upsert)
    if (stockData?.id) {
      await supabase
        .from('stock')
        .update({ current_qty: newQty, last_synced: new Date().toISOString() })
        .eq('id', stockData.id);
    } else {
      await supabase
        .from('stock')
        .insert({
          store_id: storeId,
          store_product_id: storeProductId,
          current_qty: newQty,
          min_qty: 0,
          max_qty: 0,
        });
    }

    // Record stock movement
    await supabase.from('stock_movements').insert({
      store_id: storeId,
      store_product_id: storeProductId,
      movement_type: 'received',
      qty_before: oldQty,
      qty_change: qtyReceived,
      qty_after: newQty,
      reference_type: 'order_item',
      reference_id: itemId,
    });

    // Audit log
    await supabase.from('audit_log').insert({
      store_id: storeId,
      action: 'receive_item',
      entity_type: 'order_item',
      entity_id: itemId,
      detail: { order_id: orderId, qty_received: qtyReceived, stock_before: oldQty, stock_after: newQty },
    });

    // Update local state
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const updatedItems = order.items?.map((item) =>
          item.id === itemId
            ? { ...item, qty_received: qtyReceived, status: 'received' as const }
            : item
        );
        const allReceived = updatedItems?.every((i) => i.status === 'received');
        const someReceived = updatedItems?.some((i) => i.status === 'received');
        let newStatus = order.status;
        if (allReceived) newStatus = 'complete' as const;
        else if (someReceived) newStatus = 'partial' as const;

        return { ...order, items: updatedItems, status: newStatus };
      })
    );

    // Auto-update order status in DB
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const updatedItems = order.items?.map((item) =>
        item.id === itemId ? { ...item, status: 'received' } : item
      );
      const allReceived = updatedItems?.every((i) => i.status === 'received');
      if (allReceived) {
        await supabase.from('orders').update({ status: 'complete', updated_at: new Date().toISOString() }).eq('id', orderId);
      } else {
        await supabase.from('orders').update({ status: 'partial', updated_at: new Date().toISOString() }).eq('id', orderId);
      }
    }

    setActionLoading(null);
  };

  const handleMarkOrdered = async (orderId: string) => {
    setActionLoading(`order-${orderId}`);
    await supabase.from('orders').update({
      status: 'ordered',
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);

    await supabase.from('audit_log').insert({
      store_id: storeId,
      action: 'mark_ordered',
      entity_type: 'order',
      entity_id: orderId,
    });

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ordered' as const } : o));
    setActionLoading(null);
  };

  const handleMarkSent = async (orderId: string, via: string) => {
    setActionLoading(`sent-${orderId}`);
    await supabase.from('orders').update({
      sent_at: new Date().toISOString(),
      sent_via: via,
      status: 'ordered',
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);

    await supabase.from('audit_log').insert({
      store_id: storeId,
      action: 'order_sent',
      entity_type: 'order',
      entity_id: orderId,
      detail: { sent_via: via },
    });

    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: 'ordered' as const, sent_at: new Date().toISOString(), sent_via: via }
        : o
    ));
    setActionLoading(null);
  };

  const handleCompleteOrder = async (orderId: string) => {
    setActionLoading(`complete-${orderId}`);
    await supabase.from('orders').update({
      status: 'complete',
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);

    await supabase.from('audit_log').insert({
      store_id: storeId,
      action: 'complete_order',
      entity_type: 'order',
      entity_id: orderId,
    });

    fetchOrders();
    setActionLoading(null);
  };

  // Create new order from pending items
  const handleCreateOrder = async () => {
    if (pendingItems.length === 0) return;
    setCreating(true);

    // Group by supplier
    const bySupplier = new Map<string, PendingItem[]>();
    for (const item of pendingItems) {
      const key = item.supplier_id || 'unknown';
      if (!bySupplier.has(key)) bySupplier.set(key, []);
      bySupplier.get(key)!.push(item);
    }

    // Get store code for DO number
    const { data: store } = await supabase
      .from('stores')
      .select('code')
      .eq('id', storeId)
      .single();
    const storeCode = store?.code || 'XX';

    // Get current order count for sequence
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('order_date', new Date().toISOString().split('T')[0]);

    let seq = (count || 0) + 1;

    for (const [supplierId, items] of Array.from(bySupplier.entries())) {
      const doNumber = generateDoNumber(storeCode, seq);
      seq++;

      const { data: newOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          supplier_id: supplierId === 'unknown' ? null : supplierId,
          do_number: doNumber,
          status: 'draft',
        })
        .select()
        .single();

      if (orderErr || !newOrder) {
        console.error('Error creating order:', orderErr);
        continue;
      }

      const orderItems = items.map((item) => ({
        order_id: newOrder.id,
        store_product_id: item.store_product_id,
        qty_ordered: item.qty_to_order,
        hpp_at_order: item.hpp,
        status: 'pending',
      }));

      await supabase.from('order_items').insert(orderItems);

      // Audit log
      await supabase.from('audit_log').insert({
        store_id: storeId,
        action: 'create_order',
        entity_type: 'order',
        entity_id: newOrder.id,
        detail: { do_number: doNumber, items_count: items.length, supplier_id: supplierId },
      });
    }

    setCreating(false);
    setPendingItems([]);
    setShowCreateForm(false);
    fetchOrders();
  };

  const updatePendingQty = (index: number, qty: number) => {
    setPendingItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, qty_to_order: qty } : item))
    );
  };

  const removePendingItem = (index: number) => {
    setPendingItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Pesanan & Penerimaan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola pesanan ke supplier dan konfirmasi penerimaan barang
          </p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center gap-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Buat Pesanan</span>
          </button>
        )}
      </div>

      {/* Create Order Form */}
      {showCreateForm && (
        <div className="card border-blue-200 bg-blue-50/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">
              Buat Pesanan Baru
              {pendingItems.length > 0 && ` (${pendingItems.length} item)`}
            </h3>
            <button
              onClick={() => { setShowCreateForm(false); setPendingItems([]); }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Tutup
            </button>
          </div>

          {pendingItems.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              Tidak ada item. Gunakan halaman Cek Stok untuk memilih produk yang akan dipesan.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="pb-2">Produk</th>
                      <th className="pb-2">Supplier</th>
                      <th className="pb-2 text-right">HPP</th>
                      <th className="pb-2 text-center">Qty Pesan</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100 last:border-0">
                        <td className="py-2">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.barcode}</p>
                        </td>
                        <td className="py-2 text-gray-500">{item.supplier_name}</td>
                        <td className="py-2 text-right">{formatRupiah(item.hpp)}</td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={item.qty_to_order}
                            onChange={(e) => updatePendingQty(idx, parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border rounded text-center text-sm mx-auto block"
                            min={0}
                          />
                        </td>
                        <td className="py-2">
                          <button onClick={() => removePendingItem(idx)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleCreateOrder}
                  disabled={creating}
                  className="btn-primary flex items-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                  Buat Pesanan
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filter & Search */}
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
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-field w-auto"
        >
          <option value="active">Pesanan Aktif</option>
          <option value="draft">Draft</option>
          <option value="ordered">Dipesan</option>
          <option value="partial">Sebagian Diterima</option>
          <option value="complete">Selesai</option>
          <option value="all">Semua</option>
        </select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card text-center py-16">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Belum ada pesanan</p>
          <p className="text-sm text-gray-400 mt-1">
            Buat pesanan dari halaman Cek Stok atau klik tombol &quot;Buat Pesanan&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.draft;
            const totalItems = order.items?.length || 0;
            const receivedItems = order.items?.filter((i) => i.status === 'received').length || 0;
            const hasUnreceivedItems = order.items?.some(i => i.status !== 'received');

            return (
              <div key={order.id} className="card p-0 overflow-hidden">
                {/* Order Header */}
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
                        <span className={statusInfo.class}>{statusInfo.label}</span>
                        {order.sent_via && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            via {order.sent_via}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {order.supplier?.name || 'Supplier tidak diketahui'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>{formatDateShort(order.order_date)}</span>
                        <span>{receivedItems}/{totalItems} item diterima</span>
                        {order.sent_at && (
                          <span>Dikirim: {formatDateShort(order.sent_at)}</span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                  </div>
                </button>

                {/* Order Items (expanded) */}
                {isExpanded && order.items && (
                  <div className="border-t border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="table-header">
                            <th className="px-3 py-2">Produk</th>
                            <th className="px-3 py-2">Satuan</th>
                            <th className="px-3 py-2 text-right">Qty Pesan</th>
                            <th className="px-3 py-2 text-right">Qty Diterima</th>
                            <th className="px-3 py-2 text-right">HPP</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => {
                            const itemStatus = STATUS_LABELS[item.status] || STATUS_LABELS.pending;
                            const isItemLoading = actionLoading === item.id;
                            return (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="table-cell">
                                  <div>
                                    <p className="font-medium text-sm">
                                      {item.store_product?.name || '-'}
                                    </p>
                                    <p className="text-xs text-gray-400 font-mono">
                                      {item.store_product?.barcode}
                                    </p>
                                  </div>
                                </td>
                                <td className="table-cell text-sm">
                                  {item.store_product?.unit || '-'}
                                </td>
                                <td className="table-cell text-right font-medium">
                                  {item.qty_ordered}
                                </td>
                                <td className="table-cell text-right">
                                  {item.status === 'received' ? (
                                    <span className="font-medium text-green-600">
                                      {item.qty_received}
                                    </span>
                                  ) : (
                                    <input
                                      type="number"
                                      defaultValue={item.qty_ordered}
                                      min={0}
                                      className="w-20 px-2 py-1 border rounded text-right text-sm"
                                      id={`qty-${item.id}`}
                                    />
                                  )}
                                </td>
                                <td className="table-cell text-right text-sm">
                                  {item.hpp_at_order ? formatRupiah(item.hpp_at_order) : '-'}
                                </td>
                                <td className="table-cell">
                                  <span className={itemStatus.class}>{itemStatus.label}</span>
                                </td>
                                <td className="table-cell">
                                  {item.status !== 'received' && (
                                    <button
                                      onClick={() => {
                                        const input = document.getElementById(`qty-${item.id}`) as HTMLInputElement;
                                        const qty = parseFloat(input?.value || '0');
                                        handleConfirmItem(order.id, item.id, qty, item.store_product_id);
                                      }}
                                      disabled={isItemLoading}
                                      className="text-xs btn-primary py-1 px-2"
                                    >
                                      {isItemLoading ? (
                                        <Loader2 className="w-3 h-3 inline animate-spin" />
                                      ) : (
                                        <>
                                          <CheckCircle2 className="w-3 h-3 inline mr-1" />
                                          Terima
                                        </>
                                      )}
                                    </button>
                                  )}
                                  {item.status === 'received' && item.qty_received !== item.qty_ordered && (
                                    <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                                      <AlertTriangle className="w-3 h-3" />
                                      Selisih
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Order Actions */}
                    <div className="px-4 py-3 bg-gray-50 flex flex-wrap justify-end gap-2">
                      {order.status === 'draft' && !order.sent_at && (
                        <>
                          <button
                            onClick={() => handleMarkSent(order.id, 'whatsapp')}
                            disabled={actionLoading === `sent-${order.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Kirim WA
                          </button>
                          <button
                            onClick={() => handleMarkOrdered(order.id)}
                            disabled={actionLoading === `order-${order.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Tandai Dipesan
                          </button>
                        </>
                      )}
                      {order.status !== 'complete' && !hasUnreceivedItems && (
                        <button
                          onClick={() => handleCompleteOrder(order.id)}
                          disabled={actionLoading === `complete-${order.id}`}
                          className="btn-primary text-sm py-1.5"
                        >
                          {actionLoading === `complete-${order.id}` ? (
                            <Loader2 className="w-4 h-4 inline animate-spin mr-1" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 inline mr-1" />
                          )}
                          Selesaikan Pesanan
                        </button>
                      )}
                    </div>
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
