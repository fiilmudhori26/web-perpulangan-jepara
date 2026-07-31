import client from './client';

export const getPayments = (periodId) =>
  client.get(`/payments${periodId ? `?periodId=${periodId}` : ''}`).then(r => r.data);

export const getStudentPayments = (studentId, periodId) =>
  client.get(`/payments/student/${studentId}${periodId ? `?periodId=${periodId}` : ''}`).then(r => r.data);

export const createPayment = (data) =>
  client.post('/payments', data).then(r => r.data);

export const deletePayment = (id) =>
  client.delete(`/payments/${id}`);
