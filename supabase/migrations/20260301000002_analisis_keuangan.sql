-- Migration: Analisis Keuangan
-- Menambahkan tabel operational_costs dan views untuk halaman analisis keuangan

-- ─── Tabel Biaya Operasional ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operational_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  bulan DATE NOT NULL,
  gaji_karyawan NUMERIC(20,3) DEFAULT 0,
  listrik NUMERIC(20,3) DEFAULT 0,
  sewa_tempat NUMERIC(20,3) DEFAULT 0,
  plastik_kemasan NUMERIC(20,3) DEFAULT 0,
  transportasi NUMERIC(20,3) DEFAULT 0,
  lain_lain NUMERIC(20,3) DEFAULT 0,
  total_biaya NUMERIC(20,3) GENERATED ALWAYS AS (
    gaji_karyawan + listrik + sewa_tempat + plastik_kemasan + transportasi + lain_lain
  ) STORED,
  modal_investasi NUMERIC(20,3) DEFAULT 0,
  catatan TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, bulan)
);

-- RLS
ALTER TABLE operational_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operational_costs_select" ON operational_costs FOR SELECT USING (true);
CREATE POLICY "operational_costs_insert" ON operational_costs FOR INSERT WITH CHECK (true);
CREATE POLICY "operational_costs_update" ON operational_costs FOR UPDATE USING (true);

-- ─── View: Detail Item Penjualan (dengan join path yang benar) ─────────────────
CREATE OR REPLACE VIEW v_sale_items_detail AS
SELECT
  dsi.id,
  ds.store_id,
  ds.sale_date,
  sp.id           AS store_product_id,
  sp.barcode,
  sp.name         AS nama_produk,
  sp.hpp,
  sp.sell_price,
  COALESCE(c.code, 'LAIN')     AS kategori_kode,
  COALESCE(c.name, 'Lainnya')  AS kategori_nama,
  dsi.qty_sold,
  dsi.revenue,
  dsi.hpp_total,
  dsi.profit
FROM daily_sale_items dsi
JOIN daily_sales     ds ON ds.id  = dsi.daily_sale_id
JOIN store_products  sp ON sp.id  = dsi.store_product_id
LEFT JOIN categories c  ON c.id   = sp.category_id;

-- ─── View: Margin Rendah (master data produk) ─────────────────────────────────
CREATE OR REPLACE VIEW v_margin_rendah AS
SELECT
  sp.id,
  sp.store_id,
  sp.barcode,
  sp.name AS nama_produk,
  COALESCE(c.code, 'LAIN') AS kategori_kode,
  sp.hpp,
  sp.sell_price AS harga_jual,
  ROUND(((sp.sell_price - sp.hpp) / NULLIF(sp.sell_price, 0)) * 100, 1) AS margin_pct,
  CASE
    WHEN ((sp.sell_price - sp.hpp) / NULLIF(sp.sell_price, 0)) * 100 < 5  THEN 'KRITIS'
    WHEN ((sp.sell_price - sp.hpp) / NULLIF(sp.sell_price, 0)) * 100 < 8  THEN 'RENDAH'
    WHEN ((sp.sell_price - sp.hpp) / NULLIF(sp.sell_price, 0)) * 100 < 15 THEN 'SEDANG'
    ELSE 'SEHAT'
  END AS status_margin
FROM store_products sp
LEFT JOIN categories c ON c.id = sp.category_id
WHERE sp.sell_price > 0
  AND sp.hpp > 0
  AND sp.is_deleted = false;
