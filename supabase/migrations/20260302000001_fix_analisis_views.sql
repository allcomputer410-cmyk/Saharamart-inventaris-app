-- Migration: Fix Analisis Keuangan Views
-- Masalah:
--   1. v_margin_rendah memfilter hpp > 0, sehingga produk tanpa HPP tidak muncul
--   2. v_sale_items_detail tidak perlu diubah (masalah ada di data, bukan view)

-- ─── Fix v_margin_rendah ───────────────────────────────────────────────────
-- Hapus kondisi hpp > 0 agar semua produk aktif masuk.
-- Tambahkan status 'NO_HPP' untuk produk yang belum di-set HPP-nya.
CREATE OR REPLACE VIEW v_margin_rendah AS
SELECT
  sp.id,
  sp.store_id,
  sp.barcode,
  sp.name AS nama_produk,
  COALESCE(c.code, 'LAIN') AS kategori_kode,
  sp.hpp,
  sp.sell_price AS harga_jual,
  CASE
    WHEN sp.hpp = 0 OR sp.hpp IS NULL THEN NULL
    ELSE ROUND(((sp.sell_price - sp.hpp) / NULLIF(sp.sell_price, 0)) * 100, 1)
  END AS margin_pct,
  CASE
    WHEN sp.hpp = 0 OR sp.hpp IS NULL THEN 'NO_HPP'
    WHEN ((sp.sell_price - sp.hpp) / NULLIF(sp.sell_price, 0)) * 100 < 5  THEN 'KRITIS'
    WHEN ((sp.sell_price - sp.hpp) / NULLIF(sp.sell_price, 0)) * 100 < 8  THEN 'RENDAH'
    WHEN ((sp.sell_price - sp.hpp) / NULLIF(sp.sell_price, 0)) * 100 < 15 THEN 'SEDANG'
    ELSE 'SEHAT'
  END AS status_margin
FROM store_products sp
LEFT JOIN categories c ON c.id = sp.category_id
WHERE sp.sell_price > 0
  AND sp.is_deleted = false;
