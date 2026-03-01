'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Loader2,
  Package,
} from 'lucide-react';
import { formatRupiah, formatQty } from '@/lib/utils';

type TabType = 'fast' | 'slow' | 'dead' | 'prediction';

interface ProductTrend {
  id: string;
  name: string;
  barcode: string;
  unit: string;
  currentQty: number;
  totalSold: number;
  totalRevenue: number;
  avgDailySold: number;
  daysOfStock: number | null;
  categoryName: string;
}

export default function TrendPage() {
  const params = useParams();
  const storeId = params.id as string;
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<TabType>('fast');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductTrend[]>([]);
  const [daysRange, setDaysRange] = useState(30);

  useEffect(() => {
    async function fetchTrend() {
      setLoading(true);

      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - daysRange);
      const sinceDateStr = sinceDate.toISOString().split('T')[0];

      // Get all store products with stock and category
      const { data: storeProducts } = await supabase
        .from('store_products')
        .select(`
          id, barcode, name, unit, category_id,
          category:categories(name),
          stock:stock(current_qty)
        `)
        .eq('store_id', storeId)
        .eq('is_deleted', false)
        .eq('is_active', true);

      // Get daily_sales in range
      const { data: dailySales } = await supabase
        .from('daily_sales')
        .select('id')
        .eq('store_id', storeId)
        .gte('sale_date', sinceDateStr);

      const dailySaleIds = (dailySales || []).map(d => d.id);

      // Get sale items for those days
      const saleItemsMap = new Map<string, { totalSold: number; totalRevenue: number }>();
      if (dailySaleIds.length > 0) {
        const { data: saleItems } = await supabase
          .from('daily_sale_items')
          .select('store_product_id, qty_sold, revenue')
          .in('daily_sale_id', dailySaleIds);

        for (const item of saleItems || []) {
          const existing = saleItemsMap.get(item.store_product_id) || { totalSold: 0, totalRevenue: 0 };
          existing.totalSold += item.qty_sold || 0;
          existing.totalRevenue += item.revenue || 0;
          saleItemsMap.set(item.store_product_id, existing);
        }
      }

      // Build product trends
      const trends: ProductTrend[] = (storeProducts || []).map((sp) => {
        const stockArr = Array.isArray(sp.stock) ? sp.stock : sp.stock ? [sp.stock] : [];
        const currentQty = stockArr[0]?.current_qty || 0;
        const cat = Array.isArray(sp.category) ? sp.category[0] : sp.category;
        const sales = saleItemsMap.get(sp.id) || { totalSold: 0, totalRevenue: 0 };
        const avgDaily = daysRange > 0 ? sales.totalSold / daysRange : 0;
        const daysOfStock = avgDaily > 0 ? currentQty / avgDaily : null;

        return {
          id: sp.id,
          name: sp.name,
          barcode: sp.barcode,
          unit: sp.unit || 'PCS',
          currentQty,
          totalSold: sales.totalSold,
          totalRevenue: sales.totalRevenue,
          avgDailySold: avgDaily,
          daysOfStock,
          categoryName: cat?.name || '-',
        };
      });

      setProducts(trends);
      setLoading(false);
    }

    fetchTrend();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, daysRange]);

  // Filter by tab
  const getFilteredProducts = () => {
    switch (activeTab) {
      case 'fast':
        return [...products].filter(p => p.totalSold > 0).sort((a, b) => b.totalSold - a.totalSold);
      case 'slow':
        return [...products].filter(p => p.totalSold > 0 && p.avgDailySold < 1).sort((a, b) => a.totalSold - b.totalSold);
      case 'dead':
        return products.filter(p => p.totalSold === 0 && p.currentQty > 0);
      case 'prediction':
        return [...products]
          .filter(p => p.daysOfStock !== null && p.daysOfStock < 30)
          .sort((a, b) => (a.daysOfStock || 0) - (b.daysOfStock || 0));
      default:
        return products;
    }
  };

  const filtered = getFilteredProducts();

  // Category breakdown for current tab
  const categoryBreakdown = new Map<string, { count: number; totalSold: number; totalRevenue: number }>();
  for (const p of filtered) {
    const cat = p.categoryName;
    const existing = categoryBreakdown.get(cat) || { count: 0, totalSold: 0, totalRevenue: 0 };
    existing.count++;
    existing.totalSold += p.totalSold;
    existing.totalRevenue += p.totalRevenue;
    categoryBreakdown.set(cat, existing);
  }

  const tabs: { key: TabType; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'fast', label: 'Fast Moving', icon: TrendingUp, count: products.filter(p => p.totalSold > 0).length },
    { key: 'slow', label: 'Slow Moving', icon: TrendingDown, count: products.filter(p => p.totalSold > 0 && p.avgDailySold < 1).length },
    { key: 'dead', label: 'Dead Stock', icon: AlertTriangle, count: products.filter(p => p.totalSold === 0 && p.currentQty > 0).length },
    { key: 'prediction', label: 'Prediksi', icon: BarChart3, count: products.filter(p => p.daysOfStock !== null && p.daysOfStock < 30).length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Trend & Analisis</h1>
          <p className="text-sm text-gray-500 mt-1">
            Analisis pergerakan stok dan prediksi kebutuhan
          </p>
        </div>
        <select
          value={daysRange}
          onChange={(e) => setDaysRange(parseInt(e.target.value))}
          className="input-field w-auto text-sm"
        >
          <option value={7}>7 hari</option>
          <option value={14}>14 hari</option>
          <option value={30}>30 hari</option>
          <option value={60}>60 hari</option>
          <option value={90}>90 hari</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full ml-1">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Category Breakdown */}
          {categoryBreakdown.size > 0 && (
            <div className="flex gap-2 flex-wrap">
              {Array.from(categoryBreakdown.entries())
                .sort((a, b) => b[1].totalSold - a[1].totalSold)
                .slice(0, 8)
                .map(([cat, data]) => (
                  <div key={cat} className="card py-2 px-3">
                    <p className="text-[10px] text-gray-400 uppercase">{cat}</p>
                    <p className="text-sm font-bold text-gray-800">{data.count} produk</p>
                    {data.totalSold > 0 && (
                      <p className="text-[10px] text-gray-500">{formatQty(data.totalSold)} terjual</p>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Product Table */}
          {filtered.length === 0 ? (
            <div className="card text-center py-16">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {activeTab === 'dead' ? 'Tidak ada dead stock' :
                 activeTab === 'prediction' ? 'Semua stok aman (>30 hari)' :
                 'Belum ada data penjualan'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Data muncul setelah sync penjualan dari iPOS
              </p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Produk</th>
                      <th className="px-3 py-2">Kategori</th>
                      <th className="px-3 py-2 text-right">Stok</th>
                      {activeTab !== 'dead' && (
                        <>
                          <th className="px-3 py-2 text-right">Total Terjual</th>
                          <th className="px-3 py-2 text-right">Avg/Hari</th>
                          <th className="px-3 py-2 text-right">Revenue</th>
                        </>
                      )}
                      {activeTab === 'prediction' && (
                        <th className="px-3 py-2 text-right">Sisa Hari</th>
                      )}
                      {activeTab === 'dead' && (
                        <th className="px-3 py-2 text-right">Nilai Stok</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 50).map((product, idx) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="table-cell text-gray-400 text-sm">{idx + 1}</td>
                        <td className="table-cell">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{product.barcode}</p>
                        </td>
                        <td className="table-cell text-sm text-gray-500">{product.categoryName}</td>
                        <td className="table-cell text-right">
                          <span className={product.currentQty <= 0 ? 'text-red-600 font-bold' : ''}>
                            {formatQty(product.currentQty)} {product.unit}
                          </span>
                        </td>
                        {activeTab !== 'dead' && (
                          <>
                            <td className="table-cell text-right font-medium">
                              {formatQty(product.totalSold)}
                            </td>
                            <td className="table-cell text-right text-sm text-gray-500">
                              {product.avgDailySold.toFixed(1)}/hari
                            </td>
                            <td className="table-cell text-right text-sm">
                              {formatRupiah(product.totalRevenue)}
                            </td>
                          </>
                        )}
                        {activeTab === 'prediction' && (
                          <td className="table-cell text-right">
                            {product.daysOfStock !== null ? (
                              <span className={`font-bold ${
                                product.daysOfStock <= 7 ? 'text-red-600' :
                                product.daysOfStock <= 14 ? 'text-amber-600' :
                                'text-green-600'
                              }`}>
                                {Math.round(product.daysOfStock)} hari
                              </span>
                            ) : '-'}
                          </td>
                        )}
                        {activeTab === 'dead' && (
                          <td className="table-cell text-right text-sm text-gray-500">
                            {formatQty(product.currentQty)} {product.unit}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length > 50 && (
                <div className="text-center py-2 text-xs text-gray-400 bg-gray-50">
                  Menampilkan 50 dari {filtered.length} produk
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
