import { useState, useEffect } from 'react';
import { getPeriods, createPeriod, setActivePeriod, deletePeriod } from '../api/periods';
import { formatRupiah, formatDateIndonesian, todayISO } from '../lib/utils';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import RupiahInput from '../components/RupiahInput';

import { exportToExcel, exportToPDF, prepareExportData } from '../lib/export';
import {
  CalendarDaysIcon,
  PlusIcon,
  XMarkIcon,
  ArchiveBoxXMarkIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

export default function PeriodPage() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: todayISO(), returnDeadlineDate: '', feeAmount: '', description: '', isActive: false });

  useEffect(() => { fetchPeriods(); }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    try { setPeriods(await getPeriods()); } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createPeriod({ ...form, feeAmount: parseFloat(form.feeAmount) });
      setShowAdd(false);
      setForm({ name: '', startDate: todayISO(), returnDeadlineDate: '', feeAmount: '', description: '', isActive: false });
      fetchPeriods();
    } catch (err) { alert(err.response?.data?.message || 'Gagal'); }
  };

  const handleActivate = async (id) => {
    try { await setActivePeriod(id); fetchPeriods(); }
    catch { alert('Gagal'); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Arsipkan periode ${name}?`)) return;
    try { await deletePeriod(id); fetchPeriods(); }
    catch (err) { alert(err.response?.data?.message || 'Gagal'); }
  };

  const handleExportExcel = () => {
    const { headers, rows } = prepareExportData(periods, [
      { label: 'Nama Periode', key: 'name' },
      { label: 'Tgl Mulai', render: p => formatDateIndonesian(p.startDate) },
      { label: 'Batas Kembali', render: p => formatDateIndonesian(p.returnDeadlineDate) },
      { label: 'Biaya', render: p => p.feeAmount },
      { label: 'Status', render: p => p.isActive ? 'Aktif' : 'Nonaktif' },
      { label: 'Deskripsi', render: p => p.description || '-' },
    ]);
    exportToExcel({ title: 'Periode', headers, rows, filename: 'data-periode' });
  };

  const handleExportPDF = () => {
    const { headers, rows } = prepareExportData(periods, [
      { label: 'Nama Periode', key: 'name' },
      { label: 'Tgl Mulai', render: p => formatDateIndonesian(p.startDate) },
      { label: 'Batas Kembali', render: p => formatDateIndonesian(p.returnDeadlineDate) },
      { label: 'Biaya', render: p => `Rp${p.feeAmount.toLocaleString('id-ID')}` },
      { label: 'Status', render: p => p.isActive ? 'Aktif' : 'Nonaktif' },
    ]);
    exportToPDF({ title: 'Data Periode', headers, rows, filename: 'data-periode', orientation: 'landscape' });
  };

  const columns = [
    {
      label: 'Nama Periode', render: row => (
        <span className="font-bold">{row.name}</span>
      )
    },
    { label: 'Tgl Mulai', render: row => formatDateIndonesian(row.startDate), width: '120px' },
    { label: 'Batas Kembali', render: row => formatDateIndonesian(row.returnDeadlineDate), width: '120px' },
    { label: 'Biaya', align: 'right', render: row => <span className="font-bold">{formatRupiah(row.feeAmount)}</span> },
    {
      label: 'Status', align: 'center', width: '80px',
      render: row => row.isActive ? <Badge variant="aktif">Aktif</Badge> : <span className="text-gray-300 text-xs font-bold">—</span>
    },
    {
      label: '', align: 'center', width: '180px',
      render: row => (
        <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
          {!row.isActive && (
            <button onClick={() => handleActivate(row.id)}
              className="btn-press inline-flex items-center gap-1 text-[11px] font-bold text-neo-green px-2.5 py-1.5 border border-neo-green/30 rounded-lg hover:bg-green-50 transition">
              <PlayCircleIcon className="w-3.5 h-3.5" />
              Aktifkan
            </button>
          )}
          <button onClick={() => handleDelete(row.id, row.name)}
            className="btn-press inline-flex items-center gap-1 text-[11px] font-bold text-neo-red px-2.5 py-1.5 border border-neo-red/30 rounded-lg hover:bg-red-50 transition">
            <ArchiveBoxXMarkIcon className="w-3.5 h-3.5" />
            Arsip
          </button>
        </div>
      )
    },
  ];

  if (loading) return <div className="p-8 text-center"><div className="inline-block h-8 w-8 border-4 border-neo-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <CalendarDaysIcon className="w-5 h-5 text-neo-primary" />
          <h2 className="text-lg font-bold text-neo-text-primary">Kelola Periode</h2>
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
            Periode Baru
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white border-2 border-neo-border rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-neo-primary" />
                <h3 className="text-base font-bold text-neo-text-primary">Periode Baru</h3>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-gray-100 transition">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Nama Periode <span className="text-neo-red">*</span></label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition"
                  placeholder="Contoh: Pulang Semester Genap 2025" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Tgl Mulai <span className="text-neo-red">*</span></label>
                  <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition" required />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Batas Kembali <span className="text-neo-red">*</span></label>
                  <input type="date" value={form.returnDeadlineDate} onChange={e => setForm({...form, returnDeadlineDate: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition" required />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Biaya Perpulangan <span className="text-neo-red">*</span></label>
                <RupiahInput value={form.feeAmount} onChange={v => setForm({...form, feeAmount: v})} required />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Deskripsi</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition" rows={2} />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-gray-50 border-2 border-neo-border rounded-xl hover:bg-gray-100 transition">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})}
                  className="w-4 h-4 rounded text-neo-primary focus:ring-neo-primary" />
                <span className="text-xs font-bold text-neo-text-primary">Aktifkan sekarang</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit"
                  className="btn-press flex-1 py-2.5 bg-gradient-to-r from-neo-primary to-neo-primary-dark text-white text-sm font-bold rounded-xl border-2 border-neo-primary-dark hover:brightness-110 transition flex items-center justify-center gap-1.5">
                  <CheckCircleIcon className="w-4 h-4" />
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

      <DataTable columns={columns} data={periods} emptyMessage="Belum ada periode" />
    </div>
  );
}
