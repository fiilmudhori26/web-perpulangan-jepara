/**
 * Brand configuration — default values.
 * Admin bisa mengubah ini via halaman Pengaturan.
 * Data disimpan di tabel `settings` di database.
 */
const defaultBrand = {
  name: 'Santri LP3IA',
  shortName: 'LP3IA',
  tagline: 'Pondok Pesantren Al-Qur\'an LP3IA',
  address: '',
  phone: '',
  email: '',
  website: '',
};

let cachedBrand = null;

function getDefaultBrand() {
  return { ...defaultBrand };
}

async function loadBrand(db) {
  try {
    const rows = await db.getAll('SELECT key, value FROM settings WHERE key LIKE $1', ['brand.%']);
    const brand = { ...defaultBrand };
    for (const row of rows) {
      const k = row.key.replace('brand.', '');
      if (k in brand) brand[k] = row.value;
    }
    cachedBrand = brand;
    return brand;
  } catch {
    return getDefaultBrand();
  }
}

async function getBrand(db) {
  if (cachedBrand) return cachedBrand;
  return loadBrand(db);
}

async function saveBrand(db, data) {
  for (const [key, value] of Object.entries(data)) {
    if (key in defaultBrand) {
      await db.execute(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2`,
        [`brand.${key}`, String(value)]
      );
    }
  }
  cachedBrand = null; // invalidate cache
  return loadBrand(db);
}

module.exports = { getDefaultBrand, getBrand, loadBrand, saveBrand };
