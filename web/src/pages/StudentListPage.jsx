import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudents, searchStudents, createStudent, deleteStudent } from '../api/students';
import { getPeriods } from '../api/periods';
import { getHomecomings } from '../api/homecomings';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import { exportToExcel, exportToPDF, prepareExportData } from '../lib/export';

import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArchiveBoxXMarkIcon,
  UserPlusIcon,
  XMarkIcon,
  UsersIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

export default function StudentListPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [homecomings, setHomecomings] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', room: '', guardianPhone: '', address: '', emergencyContact: '', notes: '', plan: 'PULANG KE RUMAH' });
  const [formError, setFormError] = useState('');
  const [formHomecoming, setFormHomecoming] = useState({ students: [], plan: 'PULANG KE RUMAH', departureDate: todayISO(), mandatoryReturnDate: '' });
  const [activePeriod, setActivePeriod] = useState(null);
  const perPage = 15;

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const [s, allPeriods] = await Promise.all([getStudents(false), getPeriods()]);
      const active = allPeriods.find(p => p.isActive);
      setActivePeriod(active);
      setStudents(s);
      if (active) {
        const h = await getHomecomings(active.id);
        setHomecomings(h);
      }
    }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) { fetchStudents(); return; }
    setLoading(true);
    try { setStudents(await searchStudents(query)); }
    catch { setStudents([]); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.room || !form.guardianPhone) {
      setFormError('Nama, kamar, dan no. HP wali wajib diisi'); return;
    }
    try {
      await createStudent({
        ...form,
        plan: form.plan === 'TIDAK PULANG' ? null : form.plan,
        departureDate: form.plan === 'TIDAK PULANG' ? null : form.departureDate,
        mandatoryReturnDate: form.plan === 'TIDAK PULANG' ? null : form.mandatoryReturnDate,
        periodId: activePeriod?.id
      });
      setShowAdd(false);
      setForm({ name: '', room: '', guardianPhone: '', address: '', emergencyContact: '', notes: '', plan: 'PULANG KE RUMAH' });
      fetchStudents();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Arsipkan santri ${name}?`)) return;
    try { await deleteStudent(id); fetchStudents(); }
    catch (err) { alert(err.response?.data?.message || 'Gagal'); }
  };

  const handleExportExcel = () => {
    const { headers, rows } = prepareExportData(students, [
      { label: 'Nama', key: 'name' },
      { label: 'Kamar', key: 'room' },
      { label: 'No. HP Wali', key: 'guardianPhone' },
      { label: 'Alamat', render: s => s.address || '-' },
      { label: 'Kontak Darurat', render: s => s.emergencyContact || '-' },
      { label: 'Catatan', render: s => s.notes || '-' },
    ]);
    exportToExcel({ title: 'Data Santri', headers, rows, filename: 'data-santri' });
  };

  const handleExportPDF = () => {
    const { headers, rows } = prepareExportData(students, [
      { label: 'Nama', key: 'name' },
      { label: 'Kamar', key: 'room' },
      { label: 'No. HP Wali', key: 'guardianPhone' },
      { label: 'Alamat', render: s => s.address || '-' },
      { label: 'Kontak Darurat', render: s => s.emergencyContact || '-' },
    ]);
    exportToPDF({ title: 'Data Santri', headers, rows, filename: 'data-santri', orientation: 'landscape' });
  };

  const homecomingMap = {};
  homecomings.forEach(h => { homecomingMap[h.studentId] = h; });

  const columns = [
    { key: 'name', label: 'Nama', render: row => <span className="font-bold">{row.name}</span> },
    { key: 'room', label: 'Kamar', width: '80px' },
    { key: 'address', label: 'Alamat', render: row => row.address || <span className="text-gray-300">—</span> },
    { key: 'guardianPhone', label: 'No. HP', width: '140px' },
    {
      label: 'Pulang', align: 'center', width: '110px',
      render: row => {
        const hc = homecomingMap[row.id];
        if (!hc) return <span className="text-gray-300 text-xs">—</span>;
        return <Badge variant={hc.plan === 'TIDAK PULANG' ? 'tidak pulang' : hc.plan?.toLowerCase()}>{hc.plan === 'PULANG KE RUMAH' ? 'Pulang' : hc.plan === 'PULANG PERGI' ? 'Pergi' : hc.plan === 'PULANG KE PONDOK' ? 'Pondok' : hc.plan === 'TIDAK PULANG' ? 'X' : hc.plan}</Badge>;
      }
    },
    {
      label: 'Aksi', align: 'center', width: '100px',
      render: row => (
        <button onClick={e => { e.stopPropagation(); handleDelete(row.id, row.name); }}
          className="btn-press inline-flex items-center gap-1 text-[11px] font-bold text-red-600 px-2.5 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition">
          <ArchiveBoxXMarkIcon className="w-3.5 h-3.5" />
          ARSIP
        </button>
      )
    },
  ];

  const totalPages = Math.ceil(students.length / perPage);
  const pageData = students.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <UsersIcon className="w-5 h-5 text-neo-primary" />
          <h2 className="text-lg font-bold text-neo-text-primary">Data Santri</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel} title="Export Excel"
            className="btn-press inline-flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-neo-border text-sm font-bold text-neo-text-primary rounded-xl hover:bg-gray-50 transition">
            <ArrowDownTrayIcon className="w-4 h-4 text-green-600" />
          </button>
          <button onClick={handleExportPDF} title="Export PDF"
            className="btn-press inline-flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-neo-border text-sm font-bold text-neo-text-primary rounded-xl hover:bg-gray-50 transition">
            <DocumentArrowDownIcon className="w-4 h-4 text-red-600" />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="btn-press inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-neo-primary to-neo-primary-dark text-white text-sm font-bold rounded-xl border-2 border-neo-primary-dark hover:brightness-110 transition">
            <PlusIcon className="w-4 h-4" />
            Tambah Santri
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary focus:ring-2 focus:ring-neo-primary/20 transition"
            placeholder="Cari nama, kamar, atau no. HP..." />
        </div>
        <button type="submit"
          className="btn-press px-5 py-2.5 bg-gradient-to-r from-neo-primary to-neo-primary-dark text-white text-sm font-bold rounded-xl border-2 border-neo-primary-dark hover:brightness-110 transition">
          Cari
        </button>
      </form>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-white border-2 border-neo-border rounded-xl skeleton-pulse" />)}
        </div>
      ) : (
        <DataTable columns={columns} data={pageData} onRowClick={row => navigate(`/students/${row.id}`)}
          page={page} totalPages={totalPages} onPageChange={setPage}
          emptyMessage="Belum ada data santri" />
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white border-2 border-neo-border rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <UserPlusIcon className="w-5 h-5 text-neo-primary" />
                <h3 className="text-base font-bold text-neo-text-primary">Tambah Santri</h3>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-gray-100 transition">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5">
              {/* Form fields existing */}
              {[
                { label: 'Nama Lengkap', key: 'name', required: true },
                { label: 'Kamar', key: 'room', required: true },
                { label: 'No. HP Wali', key: 'guardianPhone', required: true, type: 'tel' },
                { label: 'Alamat', key: 'address' },
                { label: 'Kontak Darurat', key: 'emergencyContact', type: 'tel' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">
                    {f.label}{f.required && <span className="text-neo-red ml-0.5">*</span>}
                  </label>
                  <input type={f.type || 'text'} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary focus:ring-2 focus:ring-neo-primary/20 transition" />
                </div>
              ))}

              {/* Plan selection */}
              <div>
                <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Rencana Pulang</label>
                <select value={form.plan} onChange={e => setForm({...form, plan: e.target.value})}
                  className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition">
                  <option value="PULANG KE RUMAH">🏠 Pulang ke Rumah</option>
                  <option value="PULANG PERGI">↔️ Pulang Pergi (biaya 2×)</option>
                  <option value="PULANG KE PONDOK">🕌 Pulang ke Pondok</option>
                  <option value="TIDAK PULANG">⛔ Tidak Pulang</option>
                </select>
              </div>

              {/* Dates (hidden when TIDAK PULANG) */}
              {form.plan !== 'TIDAK PULANG' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Tgl Berangkat</label>
                    <input type="date" value={form.departureDate} onChange={e => setForm({...form, departureDate: e.target.value})}
                      className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Batas Kembali</label>
                    <input type="date" value={form.mandatoryReturnDate} onChange={e => setForm({...form, mandatoryReturnDate: e.target.value})}
                      className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition" />
                  </div>
                </div>
              )}

              {formError && <div className="p-3 bg-red-50 border-2 border-neo-red rounded-xl text-xs font-bold text-neo-red">{formError}</div>}
              <div className="flex gap-2 pt-2">
                <button type="submit"
                  className="btn-press flex-1 py-2.5 bg-gradient-to-r from-neo-primary to-neo-primary-dark text-white text-sm font-bold rounded-xl border-2 border-neo-primary-dark hover:brightness-110 transition flex items-center justify-center gap-1.5">
                  <UserPlusIcon className="w-4 h-4" />
                  Simpan
                </button>
                <button type="button" onClick={() => setShowAdd(false)}
                  className="btn-press px-5 py-2.5 border-2 border-neo-border rounded-xl text-sm font-bold text-neo-text-primary hover:bg-gray-50 transition">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}