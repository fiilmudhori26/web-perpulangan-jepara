import client from './client';

export const getFinanceSummary = (periodId) =>
  client.get(`/finance/summary?periodId=${periodId}`).then(r => r.data);

export const getIncomes = (periodId) =>
  client.get(`/finance/incomes?periodId=${periodId}`).then(r => r.data);

export const createIncome = (data) =>
  client.post('/finance/incomes', data).then(r => r.data);

export const getExpenses = (periodId) =>
  client.get(`/finance/expenses?periodId=${periodId}`).then(r => r.data);

export const createExpense = (data) =>
  client.post('/finance/expenses', data).then(r => r.data);
