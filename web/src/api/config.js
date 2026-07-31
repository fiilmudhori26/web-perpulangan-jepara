import client from './client';

export async function getBrandConfig() {
  const res = await client.get('/config/brand');
  return res.data.config;
}

export async function saveBrandConfig(data) {
  const res = await client.put('/config/brand', data);
  return res.data.config;
}
