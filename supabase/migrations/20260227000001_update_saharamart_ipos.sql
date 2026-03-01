-- ════════════════════════════════════════════════════════
-- UPDATE: Konfigurasi iPOS untuk SAHARAMART
-- Jalankan di Supabase Dashboard → SQL Editor
-- Data real dari konfirmasi langsung 27 Feb 2026
-- ════════════════════════════════════════════════════════

-- Update jika store sudah ada
UPDATE stores
SET
  ipos_kodekantor = 'UTM',
  ipos_db_name    = 'i4_SAHARAMART',
  ipos_db_host    = 'localhost',
  ipos_db_port    = 5444
WHERE code = 'SM01';

-- Insert jika belum ada
INSERT INTO stores (code, name, type, ipos_kodekantor, ipos_db_host, ipos_db_port, ipos_db_name, is_active)
SELECT 'SM01', 'SAHARAMART', 'toko', 'UTM', 'localhost', 5444, 'i4_SAHARAMART', true
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE code = 'SM01');

-- Verifikasi
SELECT id, code, name, ipos_kodekantor, ipos_db_name, is_active
FROM stores
WHERE code = 'SM01';
