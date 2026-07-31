import client from './client';

export const getStudents = (archived = false) =>
  client.get(`/students?archived=${archived}`).then(r => r.data);

export const searchStudents = (q) =>
  client.get(`/students/search?q=${encodeURIComponent(q)}`).then(r => r.data);

export const getStudent = (id) =>
  client.get(`/students/${id}`).then(r => r.data);

export const createStudent = (data) =>
  client.post('/students', data).then(r => r.data);

export const updateStudent = (id, data) =>
  client.put(`/students/${id}`, data).then(r => r.data);

export const deleteStudent = (id) =>
  client.delete(`/students/${id}`);
