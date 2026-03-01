-- Migration: Create sales_transactions, payment_method_overrides, v_rekap_kasir
-- Date: 2026-03-01

-- ============================================================
-- 1. Tabel sales_transactions
--    Menyimpan per-transaksi dari tbl_ikhd iPOS
-- ============================================================
CREATE TABLE IF NOT EXISTS sales_transactions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notransaksi    text NOT NULL,
  store_id       uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  kodekantor     text,
  tanggal        timestamptz NOT NULL,
  totalakhir     numeric(20,3) NOT NULL DEFAULT 0,
  keterangan     text,
  kasir          text,
  shiftkerja     text,
  tipe           text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_transactions_notransaksi_key UNIQUE (notransaksi)
);

CREATE INDEX IF NOT EXISTS idx_sales_transactions_store_id   ON sales_transactions (store_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_tanggal    ON sales_transactions (tanggal);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_kasir      ON sales_transactions (kasir);

-- ============================================================
-- 2. Tabel payment_method_overrides
--    Menyimpan koreksi manual metode bayar per-transaksi
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_method_overrides (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notransaksi     text NOT NULL,
  metode_override text NOT NULL CHECK (metode_override IN ('TUNAI','QRIS','TRANSFER','DEBIT')),
  alasan          text,
  corrected_by    text,
  corrected_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_method_overrides_notransaksi_key UNIQUE (notransaksi)
);

CREATE INDEX IF NOT EXISTS idx_pmo_notransaksi ON payment_method_overrides (notransaksi);

-- ============================================================
-- 3. View v_rekap_kasir
--    JOIN sales_transactions + overrides, 3-layer detection
-- ============================================================
CREATE OR REPLACE VIEW v_rekap_kasir AS
SELECT
  st.id,
  st.notransaksi,
  st.store_id,
  st.kodekantor,
  st.tanggal,
  st.totalakhir,
  st.keterangan,
  st.kasir,
  st.shiftkerja,
  st.tipe,
  st.created_at,

  -- 3-layer payment method detection
  CASE
    WHEN pmo.metode_override IS NOT NULL          THEN pmo.metode_override
    WHEN st.keterangan ILIKE '%QRIS%'             THEN 'QRIS'
    WHEN st.keterangan ILIKE '%TRANSFER%'         THEN 'TRANSFER'
    WHEN st.keterangan ILIKE '%DEBIT%'            THEN 'DEBIT'
    ELSE 'TUNAI'
  END AS metode_bayar,

  -- Manual override flag
  (pmo.metode_override IS NOT NULL)               AS is_manual_override,
  pmo.alasan                                      AS alasan_override,
  pmo.corrected_by,
  pmo.corrected_at,

  -- needs_review: keterangan kosong + totalakhir >= 50000 + kelipatan 1000
  (
    (st.keterangan IS NULL OR TRIM(st.keterangan) = '')
    AND st.totalakhir >= 50000
    AND MOD(st.totalakhir::numeric, 1000) = 0
  )                                               AS needs_review

FROM sales_transactions st
LEFT JOIN payment_method_overrides pmo
  ON pmo.notransaksi = st.notransaksi;
