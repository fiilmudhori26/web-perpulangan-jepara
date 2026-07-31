import client from './client';

export const getHomecomings = (periodId) =>
  client.get(`/homecomings${periodId ? `?periodId=${periodId}` : ''}`).then(r => r.data);

export const getStudentHomecoming = (studentId, periodId) =>
  client.get(`/homecomings/student/${studentId}${periodId ? `?periodId=${periodId}` : ''}`).then(r => r.data);

export const createHomecoming = (data) =>
  client.post('/homecomings', data).then(r => r.data);

export const updateHomecoming = (id, data) =>
  client.put(`/homecomings/${id}`, data).then(r => r.data);
