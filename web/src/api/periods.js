import client from './client';

export const getPeriods = () =>
  client.get('/periods').then(r => r.data);

export const getPeriod = (id) =>
  client.get(`/periods/${id}`).then(r => r.data);

export const createPeriod = (data) =>
  client.post('/periods', data).then(r => r.data);

export const updatePeriod = (id, data) =>
  client.put(`/periods/${id}`, data).then(r => r.data);

export const setActivePeriod = (id) =>
  client.put(`/periods/${id}/active`).then(r => r.data);

export const deletePeriod = (id) =>
  client.delete(`/periods/${id}`);
