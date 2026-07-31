import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPeriods } from '../api/periods';
import { getStudents } from '../api/students';
import { getHomecomings, createHomecoming, updateHomecoming } from '../api/homecomings';
import { formatDateIndonesian, todayISO } from '../lib/utils';
import { exportToExcel, exportToPDF, prepareExportData } from '../lib/export';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';

import {
  TruckIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

export default function HomecomingPage() {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState([]);
  const [activePeriod, setActivePeriod] = useState(null);
  const [students, setStudents] = useState([]);
  const [homecomings, setHomecomings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    studentId: '', plan: 'PULANG KE RUMAH', departureDate: todayISO(),
    mandatoryReturnDate: '', actualReturnDate: '', notes: ''
  });
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    getPeriods().then(all => {
      setPeriods(all);
      const active = all.find(p => p.isActive);
      if (active) {
        setActivePeriod(active);
        Promise.all([getStudents(false), getHomecomings(active.id)])
          .then(([s, h]) => { setStudents(s); setHomecomings(h); })
          .finally(() => setLoading(false));
      } else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const switchPeriod = async (p) => {
    setActivePeriod(p); setLoading(true);
    const [s, h] = await Promise.all([getStudents(false), getHomecomings(p.id)]);
    setStudents(s); setHomecomings(h); setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!activePeriod) return;
    try {
      await createHomecoming({ ...form, studentId: form.studentId, periodId: activePeriod.id });
      setShowAdd(false);
      setForm({ studentId: '', plan: 'PULANG KE RUMAH', departureDate: todayISO(), mandatoryReturnDate: '', actualReturnDate: '', notes: '' });
      setHomecomings(await getHomecomings(activePeriod.id));
    } catch (err) { alert(err.response?.data?.message || 'Gagal'); }
  };

  const handleMarkReturn = async (hc) => {
    const date = prompt('Tanggal kembali (YYYY-MM-DD):', todayISO());
    if (!date) return;
    try { await updateHomecoming(hc.id, { actualReturnDate: date }); setHomecomings(await getHomecomings(activePeriod.id)); }
    catch { alert('Gagal'); }
  };

  const handleExportExcel = () => {
    const { headers, rows } = prepareExportData(homecomings, [
      { label: 'Santri', render: h => studentMap[h.studentId]?.name || 'Unknown' },
      { label: 'Rencana', render: h => h.plan === 'PULANG KE RUMAH' ? 'Pulang ke Rumah' : h.plan === 'PULANG PERGI' ? 'Pulang Pergi' : h.plan === 'PULANG KE PONDOK' ? 'Pulang ke Pondok' : h.plan === 'TIDAK PULANG' ? 'Tidak Pulang' : h.plan },
      { label: 'Berangkat', render: h => formatDateIndonesian(h.departureDate) },
      { label: 'Batas Kembali', render: h => formatDateIndonesian(h.mandatoryReturnDate) },
      { label: 'Tgl Kembali', render: h => h.actualReturnDate ? formatDateIndonesian(h.actualReturnDate) : '-' },
    ]);
    exportToExcel({ title: 'Perpulangan', headers, rows, filename: `Perpulangan_${activePeriod.name.replace(/\s/g,'_')}` });
  };

  const handleExportPDF = () => {
    const { headers, rows } = prepareExportData(homecomings, [
      { label: 'Santri', render: h => studentMap[h.studentId]?.name || 'Unknown' },
      { label: 'Rencana', render: h => h.plan === 'PULANG KE RUMAH' ? 'Pulang ke Rumah' : h.plan === 'PULANG PERGI' ? 'Pulang Pergi' : h.plan === 'PULANG KE PONDOK' ? 'Pulang ke Pondok' : h.plan === 'TIDAK PULANG' ? 'Tidak Pulang' : h.plan },
      { label: 'Berangkat', render: h => formatDateIndonesian(h.departureDate) },
      { label: 'Batas Kembali', render: h => formatDateIndonesian(h.mandatoryReturnDate) },
      { label: 'Tgl Kembali', render: h => h.actualReturnDate ? formatDateIndonesian(h.actualReturnDate) : '-' },
    ]);
    exportToPDF({
      title: 'Data Perpulangan', subtitle: activePeriod.name,
      headers, rows, filename: `Perpulangan_${activePeriod.name.replace(/\s/g,'_')}`, orientation: 'landscape',
    });
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.room.toLowerCase().includes(searchQ.toLowerCase())
  );

  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s; });

  const columns = [
    {
      label: 'Santri', render: row => {
        const s = studentMap[row.studentId];
        return <span className="font-bold">{s?.name || 'Unknown'}</span>;
      }
    },
    { label: 'Rencana', render: row => <Badge variant={row.plan === 'TIDAK PULANG' ? 'tidak pulang' : row.plan?.toLowerCase()}>{row.plan === 'PULANG KE RUMAH' ? 'Pulang ke Rumah' : row.plan === 'PULANG PERGI' ? 'Pulang Pergi' : row.plan === 'PULANG KE PONDOK' ? 'Pulang ke Pondok' : row.plan === 'TIDAK PULANG' ? 'Tidak Pulang' : row.plan}</Badge> },
    { label: 'Berangkat', render: row => formatDateIndonesian(row.departureDate), width: '120px' },
    { label: 'Batas Kembali', render: row => formatDateIndonesian(row.mandatoryReturnDate), width: '120px' },
    {
      label: 'Status', align: 'center', width: '100px',
      render: row => row.actualReturnDate
        ? <Badge variant="lunas">Kembali</Badge>
        : <span className="text-gray-300 text-xs font-bold">—</span>
    },
    {
      label: '', align: 'center', width: '130px',
      render: row => !row.actualReturnDate ? (
        <button onClick={e => { e.stopPropagation(); handleMarkReturn(row); }}
          className="btn-press inline-flex items-center gap-1 text-[11px] font-bold text-neo-green px-2.5 py-1.5 border border-neo-green/30 rounded-lg hover:bg-green-50 transition">
          <CheckCircleIcon className="w-3.5 h-3.5" />
          TANDAI KEMBALI
        </button>
      ) : null
    },
  ];

  if (loading) return <div className="p-8 text-center"><div className="inline-block h-8 w-8 border-4 border-neo-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!activePeriod) return <div className="p-8 text-center text-gray-500 font-bold">Tidak ada periode aktif. Buat periode dulu.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <TruckIcon className="w-5 h-5 text-neo-green" />
          <h2 className="text-lg font-bold text-neo-text-primary">Perpulangan</h2>
          <select onChange={e => { const p = periods.find(x => x.id === e.target.value); if (p) switchPeriod(p); }}
            value={activePeriod.id}
            className="text-xs font-bold border-2 border-neo-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-neo-primary">
            {periods.map(p => <option key={p.id} value={p.id}>{p.name}{p.isActive ? ' (Aktif)' : ''}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <button onClick={handleExportExcel} title="Export Excel"
              className="btn-press inline-flex items-center gap-1 px-3 py-2 border-2 border-neo-border rounded-xl text-xs font-bold text-neo-text-primary hover:bg-gray-50 transition">
              <DocumentArrowDownIcon className="w-4 h-4" />
              Excel
            </button>
            <button onClick={handleExportPDF} title="Export PDF"
              className="btn-press inline-flex items-center gap-1 px-3 py-2 border-2 border-neo-border rounded-xl text-xs font-bold text-neo-text-primary hover:bg-gray-50 transition">
              <DocumentArrowDownIcon className="w-4 h-4" />
              PDF
            </button>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="btn-press inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-neo-primary to-neo-primary-dark text-white text-sm font-bold rounded-xl border-2 border-neo-primary-dark hover:brightness-110 transition">
            <PlusIcon className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white border-2 border-neo-border rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TruckIcon className="w-5 h-5 text-neo-green" />
                <h3 className="text-base font-bold text-neo-text-primary">Tambah Perpulangan</h3>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-gray-100 transition">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5">
              {/* Student Search */}
              <div>
                <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Cari Santri</label>
                <div className="relative mb-2">
                  <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition"
                    placeholder="Nama atau kamar..." />
                </div>
                <div className="max-h-32 overflow-y-auto border-2 border-neo-border rounded-xl divide-y divide-gray-100">
                  {filteredStudents.map(s => (
                    <div key={s.id} onClick={() => { setForm({...form, studentId: s.id}); setSearchQ(s.name); }}
                      className={`px-3 py-2.5 text-sm font-semibold cursor-pointer transition ${
                        form.studentId === s.id ? 'bg-neo-primary text-white' : 'hover:bg-gray-50 text-neo-text-primary'
                      }`}>
                      {s.name} — <span className="font-medium">{s.room}</span>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && <div className="px-3 py-4 text-sm text-gray-400 text-center">Tidak ditemukan</div>}
                </div>
              </div>

              {/* Plan */}
              <div>
                <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Rencana</label>
                <select value={form.plan} onChange={e => setForm({...form, plan: e.target.value})}
                  className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition">
                  <option value="PULANG KE RUMAH">🏠 Pulang ke Rumah</option>
                  <option value="PULANG PERGI">↔️ Pulang Pergi (biaya 2×)</option>
                  <option value="PULANG KE PONDOK">🕌 Pulang ke Pondok</option>
                  <option value="TIDAK PULANG">⛔ Tidak Pulang</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Tgl Berangkat</label>
                  <input type="date" value={form.departureDate} onChange={e => setForm({...form, departureDate: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition" required />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Batas Kembali</label>
                  <input type="date" value={form.mandatoryReturnDate} onChange={e => setForm({...form, mandatoryReturnDate: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition" required />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Catatan</label>
                <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit"
                  className="btn-press flex-1 py-2.5 bg-gradient-to-r from-neo-primary to-neo-primary-dark text-white text-sm font-bold rounded-xl border-2 border-neo-primary-dark hover:brightness-110 transition flex items-center justify-center gap-1.5">
                  <TruckIcon className="w-4 h-4" />
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

      <DataTable columns={columns} data={homecomings}
        onRowClick={row => navigate(`/students/${row.studentId}`)}
        emptyMessage="Belum ada data perpulangan" />
    </div>
  );
}
