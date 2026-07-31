import client from './client';

export const searchSantri = (studentName, guardianPhone) =>
  client.post('/public/santri/search', { studentName, guardianPhone }).then(r => r.data);
