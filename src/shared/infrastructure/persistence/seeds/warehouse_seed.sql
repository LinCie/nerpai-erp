-- Seed Data: Indonesian Warehouses
-- Run this after the warehouse table is created and you have an organization set up
-- Replace the organization_id placeholder with your actual organization UUID

-- IMPORTANT: Replace 'YOUR_ORGANIZATION_UUID_HERE' with the actual organization ID
-- You can get this from the organization table or from your session

INSERT INTO warehouse (
  name,
  code,
  street_address,
  city,
  province,
  postal_code,
  country,
  contact_name,
  contact_phone,
  contact_email,
  notes,
  organization_id
) VALUES
-- Kediri Warehouse
(
  'Gudang Utama Kediri',
  'WH-KDR-001',
  'Jl. Veteran No. 15, Kel. Pare, Kec. Pare',
  'Kediri',
  'Jawa Timur',
  '64213',
  'Indonesia',
  'Budi Santoso',
  '+62 812-3456-7890',
  'budi.santoso@example.com',
  'Gudang utama untuk distribusi wilayah Kediri dan sekitarnya. Kapasitas 500 pallet.',
  'YOUR_ORGANIZATION_UUID_HERE'::UUID
),
-- Surabaya Warehouses
(
  'Gudang Surabaya Timur',
  'WH-SBY-001',
  'Jl. Raya Wonokromo No. 123, Kec. Wonokromo',
  'Surabaya',
  'Jawa Timur',
  '60243',
  'Indonesia',
  'Siti Rahayu',
  '+62 811-2345-6789',
  'siti.rahayu@example.com',
  'Gudang untuk area Surabaya Timur dan sekitarnya. Lokasi strategis dekat pelabuhan.',
  'YOUR_ORGANIZATION_UUID_HERE'::UUID
),
(
  'Gudang Surabaya Barat',
  'WH-SBY-002',
  'Jl. Darmo Permai Utara No. 45, Kec. Tandes',
  'Surabaya',
  'Jawa Timur',
  '60187',
  'Indonesia',
  'Ahmad Wijaya',
  '+62 813-4567-8901',
  'ahmad.wijaya@example.com',
  'Gudang sekunder Surabaya untuk overflow inventory.',
  'YOUR_ORGANIZATION_UUID_HERE'::UUID
),
-- Jakarta Warehouses
(
  'Gudang Pusat Jakarta',
  'WH-JKT-001',
  'Jl. Daan Mogot No. 88, Kec. Cengkareng',
  'Jakarta Barat',
  'DKI Jakarta',
  '11710',
  'Indonesia',
  'Dewi Kusuma',
  '+62 814-5678-9012',
  'dewi.kusuma@example.com',
  'Gudang pusat untuk distribusi Jabodetabek. Kapasitas 1000 pallet, 20 dock.',
  'YOUR_ORGANIZATION_UUID_HERE'::UUID
),
(
  'Gudang Jakarta Timur',
  'WH-JKT-002',
  'Jl. Bekasi Timur Raya No. 200, Kec. Cakung',
  'Jakarta Timur',
  'DKI Jakarta',
  '13910',
  'Indonesia',
  'Eko Prasetyo',
  '+62 815-6789-0123',
  'eko.prasetyo@example.com',
  'Gudang untuk area Jakarta Timur dan Bekasi.',
  'YOUR_ORGANIZATION_UUID_HERE'::UUID
),
-- Tangerang Warehouse
(
  'Gudang Tangerang',
  'WH-TNG-001',
  'Jl. Gatot Subroto No. 77, Kec. Cikokol',
  'Tangerang',
  'Banten',
  '15117',
  'Indonesia',
  'Rini Susanti',
  '+62 816-7890-1234',
  'rini.susanti@example.com',
  'Gudang untuk area Tangerang dan sekitarnya. Dekat bandara Soekarno-Hatta.',
  'YOUR_ORGANIZATION_UUID_HERE'::UUID
);

-- Verification query (uncomment to run):
-- SELECT * FROM warehouse WHERE organization_id = 'YOUR_ORGANIZATION_UUID_HERE'::UUID;
