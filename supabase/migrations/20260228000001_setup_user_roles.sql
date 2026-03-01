-- ════════════════════════════════════════════════════════════════
-- SETUP USER ROLES — SAHARAMART
-- Jalankan di: Supabase Dashboard → SQL Editor
--
-- LANGKAH PENGGUNAAN:
--   1. Jalankan BAGIAN 1 dulu → lihat UUID user yang sudah terdaftar
--   2. Buat akun user di Dashboard → Authentication → Users (jika belum ada)
--   3. Jalankan BAGIAN 2 → isi UUID yang didapat dari Langkah 1
--   4. Jalankan BAGIAN 3 → verifikasi hasilnya
--
-- ROLE YANG TERSEDIA:
--   owner      → akses penuh termasuk Penjualan Harian
--   manajer    → akses penuh termasuk Penjualan Harian
--   staff      → akses umum, TIDAK bisa lihat Penjualan Harian
--   kasir      → akses terbatas (sama seperti staff)
-- ════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────
-- BAGIAN 1: CEK USER YANG SUDAH ADA DI SUPABASE AUTH
-- Jalankan ini dulu untuk lihat UUID masing-masing user
-- ────────────────────────────────────────────────────────────────

SELECT
  id          AS "UUID (copy untuk bagian 2)",
  email,
  created_at  AS "Tgl Daftar",
  last_sign_in_at AS "Login Terakhir"
FROM auth.users
ORDER BY created_at;


-- ────────────────────────────────────────────────────────────────
-- BAGIAN 2: BUAT / UPDATE PROFIL & ROLE USER
--
-- ⚠️  GANTI PLACEHOLDER di bawah ini:
--     'GANTI-UUID-...'  → UUID dari hasil query Bagian 1
--     'Nama Lengkap'    → nama asli orang tersebut
--     'email@...'       → email login di Supabase Auth
--
-- Script ini aman dijalankan berulang kali (ON CONFLICT = update)
-- ────────────────────────────────────────────────────────────────

-- Ambil store_id SAHARAMART sekali untuk dipakai di bawah
DO $$
DECLARE
  v_store_id UUID;
BEGIN
  SELECT id INTO v_store_id FROM stores WHERE code = 'SM01' LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Toko SM01 (SAHARAMART) tidak ditemukan. Jalankan insert_saharamart.sql dulu.';
  END IF;

  -- ── OWNER ────────────────────────────────────────────────────
  -- Ganti UUID dan data di bawah ini dengan data Owner/Pemilik toko
  INSERT INTO user_profiles (id, name, email, role, store_id, is_active)
  VALUES (
    'GANTI-UUID-OWNER',           -- UUID dari auth.users
    'Nama Pemilik Toko',          -- nama lengkap
    'owner@email.com',            -- email
    'owner',
    v_store_id,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role       = 'owner',
    store_id   = v_store_id,
    is_active  = true,
    name       = EXCLUDED.name,
    email      = EXCLUDED.email;

  -- ── MANAJER ──────────────────────────────────────────────────
  -- Ganti UUID dan data di bawah ini dengan data Manajer toko
  INSERT INTO user_profiles (id, name, email, role, store_id, is_active)
  VALUES (
    'GANTI-UUID-MANAJER',         -- UUID dari auth.users
    'Nama Manajer',               -- nama lengkap
    'manajer@email.com',          -- email
    'manajer',
    v_store_id,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role       = 'manajer',
    store_id   = v_store_id,
    is_active  = true,
    name       = EXCLUDED.name,
    email      = EXCLUDED.email;

  -- ── STAFF / KASIR 1 ──────────────────────────────────────────
  -- Tidak bisa akses Penjualan Harian
  INSERT INTO user_profiles (id, name, email, role, store_id, is_active)
  VALUES (
    'GANTI-UUID-STAFF-1',         -- UUID dari auth.users
    'Nama Staff 1',               -- nama lengkap
    'staff1@email.com',           -- email
    'staff',
    v_store_id,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role       = 'staff',
    store_id   = v_store_id,
    is_active  = true,
    name       = EXCLUDED.name,
    email      = EXCLUDED.email;

  -- ── STAFF / KASIR 2 (tambah sesuai kebutuhan) ────────────────
  INSERT INTO user_profiles (id, name, email, role, store_id, is_active)
  VALUES (
    'GANTI-UUID-STAFF-2',         -- UUID dari auth.users
    'Nama Staff 2',               -- nama lengkap
    'staff2@email.com',           -- email
    'staff',
    v_store_id,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role       = 'staff',
    store_id   = v_store_id,
    is_active  = true,
    name       = EXCLUDED.name,
    email      = EXCLUDED.email;

  RAISE NOTICE 'Setup role selesai untuk toko: %', v_store_id;
END $$;


-- ────────────────────────────────────────────────────────────────
-- BAGIAN 3: VERIFIKASI HASIL
-- Jalankan setelah Bagian 2 untuk cek apakah sudah benar
-- ────────────────────────────────────────────────────────────────

SELECT
  up.name                     AS "Nama",
  up.email,
  up.role                     AS "Role",
  CASE up.role
    WHEN 'owner'   THEN '✅ Bisa akses Penjualan'
    WHEN 'manajer' THEN '✅ Bisa akses Penjualan'
    WHEN 'direktur'THEN '✅ Bisa akses Penjualan'
    WHEN 'gm'      THEN '✅ Bisa akses Penjualan'
    ELSE                '🔒 TIDAK bisa akses Penjualan'
  END                         AS "Hak Akses Penjualan",
  s.name                      AS "Toko",
  up.is_active                AS "Aktif"
FROM user_profiles up
LEFT JOIN stores s ON s.id = up.store_id
ORDER BY
  CASE up.role
    WHEN 'owner'   THEN 1
    WHEN 'manajer' THEN 2
    WHEN 'direktur'THEN 3
    WHEN 'gm'      THEN 4
    ELSE 5
  END;


-- ────────────────────────────────────────────────────────────────
-- BONUS: Ubah role user yang sudah ada (jalankan per baris sesuai kebutuhan)
-- ────────────────────────────────────────────────────────────────

-- Contoh: naikkan staff menjadi manajer
-- UPDATE user_profiles SET role = 'manajer' WHERE email = 'email_yang_mau_diubah@gmail.com';

-- Contoh: turunkan manajer menjadi staff
-- UPDATE user_profiles SET role = 'staff' WHERE email = 'email_yang_mau_diubah@gmail.com';

-- Contoh: nonaktifkan user (tidak bisa login ke app)
-- UPDATE user_profiles SET is_active = false WHERE email = 'email@gmail.com';
