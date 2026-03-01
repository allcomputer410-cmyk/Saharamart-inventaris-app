-- ════════════════════════════════════════════════════════
-- CLEANUP: Hapus semua data dummy (TK01, TK02, i4_tes)
-- Jalankan di Supabase Dashboard → SQL Editor
-- PERINGATAN: Ini akan menghapus SEMUA data!
-- ════════════════════════════════════════════════════════

-- 1. Hapus data penjualan
DELETE FROM daily_sale_items;
DELETE FROM daily_sales;

-- 2. Hapus stock movements & stock
DELETE FROM stock_movements;
DELETE FROM stock;

-- 3. Hapus pesanan
DELETE FROM order_items;
DELETE FROM orders;

-- 4. Hapus produk
DELETE FROM store_products;
DELETE FROM product_catalog;

-- 5. Hapus relasi toko-supplier
DELETE FROM store_suppliers;

-- 6. Hapus notifikasi
DELETE FROM notifications;

-- 7. Hapus log
DELETE FROM audit_log;
DELETE FROM sync_log;

-- 8. Hapus master data
DELETE FROM suppliers;
DELETE FROM categories;
DELETE FROM brands;
DELETE FROM units;

-- 9. Hapus promo (disabled tables)
DELETE FROM promo_products;
DELETE FROM promo_rules;
DELETE FROM promotions;

-- 10. Hapus warehouse (disabled tables)
DELETE FROM stock_opname_items;
DELETE FROM stock_opnames;
DELETE FROM warehouse_transfer_items;
DELETE FROM warehouse_transfers;

-- 11. Hapus stores
DELETE FROM stores;

-- Konfirmasi
SELECT 'Cleanup selesai! Semua data dummy telah dihapus.' AS status;
