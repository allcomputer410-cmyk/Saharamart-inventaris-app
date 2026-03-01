-- ════════════════════════════════════════════════════════
-- INSERT: Toko SAHARAMART
-- Jalankan di Supabase Dashboard → SQL Editor
-- SETELAH menjalankan cleanup script
-- ════════════════════════════════════════════════════════

-- Insert toko SAHARAMART
-- ⚠️  GANTI PLACEHOLDER dengan data asli dari iPOS:
--     ipos_kodekantor → cek di iPOS: Master → Kantor, atau query: SELECT * FROM tbl_kantor
--     ipos_db_name    → cek di pgAdmin → Databases (nama database iPOS yang asli)
--     ipos_db_host    → 'localhost' kalau sync agent jalan di PC kasir yang sama
INSERT INTO stores (
  code,
  name,
  address,
  phone,
  type,
  ipos_kodekantor,
  ipos_db_host,
  ipos_db_port,
  ipos_db_name,
  is_active
) VALUES (
  'SM01',
  'SAHARAMART',
  NULL,                    -- Isi alamat toko nanti
  NULL,                    -- Isi nomor telepon nanti
  'toko',
  'GANTI_KODE_KANTOR',    -- ⚠️ GANTI dengan kode kantor iPOS (contoh: '01' atau 'TOKO1')
  'localhost',             -- Host PC kasir (localhost jika sync dari PC yang sama)
  5432,                    -- Port PostgreSQL iPOS (default: 5432)
  'GANTI_NAMA_DATABASE',  -- ⚠️ GANTI dengan nama database iPOS (contoh: 'i4_saharamart')
  true
);

-- Verifikasi
SELECT id, code, name, ipos_kodekantor, ipos_db_name
FROM stores
WHERE code = 'SM01';
