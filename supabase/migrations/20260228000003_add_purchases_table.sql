-- =============================================================
-- Migration: Tambah tabel purchases + purchase_items
-- Sumber: iPOS tbl_imhd (header) + tbl_imdt (detail)
-- =============================================================

-- 1. Tabel purchases (header faktur pembelian)
CREATE TABLE IF NOT EXISTS purchases (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  ipos_notransaksi VARCHAR(100),          -- notransaksi dari tbl_imhd (unique key)
  faktur_no       VARCHAR(100),           -- sama dengan ipos_notransaksi
  tanggal         TIMESTAMPTZ,            -- tanggal transaksi
  tipe            VARCHAR(20) DEFAULT 'BL', -- BL=Beli, IM=Invoice Masuk
  supplier_id     UUID REFERENCES suppliers(id),
  ipos_kodesupel  VARCHAR(50),            -- kode supplier di iPOS
  total_item      NUMERIC(20,3) DEFAULT 0, -- total qty item
  subtotal        NUMERIC(20,3) DEFAULT 0,
  potongan        NUMERIC(20,3) DEFAULT 0, -- potongan faktur
  pajak           NUMERIC(20,3) DEFAULT 0,
  total_akhir     NUMERIC(20,3) DEFAULT 0, -- grand total
  cara_bayar      VARCHAR(50),             -- Tunai / Kredit
  keterangan      TEXT,
  synced_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT purchases_ipos_notransaksi_key UNIQUE (ipos_notransaksi)
);

-- 2. Tabel purchase_items (detail per item per faktur)
CREATE TABLE IF NOT EXISTS purchase_items (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id      UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  store_product_id UUID REFERENCES store_products(id),
  ipos_kodeitem    VARCHAR(100),          -- kodeitem dari tbl_imdt
  ipos_iddetail    VARCHAR(150),          -- iddetail dari tbl_imdt (unique key)
  jumlah           NUMERIC(20,3) DEFAULT 0, -- qty beli
  satuan           VARCHAR(50),
  harga            NUMERIC(20,3) DEFAULT 0, -- harga satuan
  potongan         NUMERIC(20,3) DEFAULT 0, -- potongan per item
  total            NUMERIC(20,3) DEFAULT 0, -- total baris
  created_at       TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT purchase_items_ipos_iddetail_key UNIQUE (ipos_iddetail)
);

-- 3. Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_purchases_store_id    ON purchases(store_id);
CREATE INDEX IF NOT EXISTS idx_purchases_tanggal     ON purchases(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_store_tanggal ON purchases(store_id, tanggal DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id      ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_store_product_id ON purchase_items(store_product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_ipos_kodeitem    ON purchase_items(ipos_kodeitem);

-- 4. Row Level Security
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

-- Authenticated users bisa baca
CREATE POLICY "purchases_select" ON purchases
  FOR SELECT TO authenticated USING (true);

-- Service role bisa semua (dipakai sync agent)
CREATE POLICY "purchases_service" ON purchases
  FOR ALL TO service_role USING (true);

CREATE POLICY "purchase_items_select" ON purchase_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "purchase_items_service" ON purchase_items
  FOR ALL TO service_role USING (true);
