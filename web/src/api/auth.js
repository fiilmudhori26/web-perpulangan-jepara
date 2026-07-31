import client from './client';

export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then(r => r.data);

export const logout = () =>
  client.post('/auth/logout').then(r => r.data);

export const getMe = () =>
  client.post('/auth/me').then(r => r.data);
