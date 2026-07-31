import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPeriods } from '../api/periods';
import { getStudents } from '../api/students';
import { getPayments, createPayment, deletePayment } from '../api/payments';
import { formatRupiah, formatDateIndonesian, todayISO, fileToBase64 } from '../lib/utils';
import DataTable from '../components/DataTable';
import RupiahInput from '../components/RupiahInput';

import { exportToExcel, exportToPDF, prepareExportData } from '../lib/export';

import {
  CreditCardIcon,
  PlusIcon,
  XMarkIcon,
  PhotoIcon,
  TrashIcon,
  CheckCircleIcon,
  UserCircleIcon,
  BanknotesIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

export default function PaymentListPage() {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState([]);
  const [activePeriod, setActivePeriod] = useState(null);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [form, setForm] = useState({ studentId: '', amount: '', date: todayISO(), method: 'TUNAI', notes: '', receiptPath: '' });
  const [receiptModal, setReceiptModal] = useState(null);
  const perPage = 15;

  useEffect(() => {
    getPeriods().then(all => {
      setPeriods(all);
      const active = all.find(p => p.isActive);
      if (active) {
        setActivePeriod(active);
        Promise.all([getStudents(false), getPayments(active.id)])
          .then(([s, p]) => { setStudents(s); setPayments(p); })
          .finally(() => setLoading(false));
      } else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const switchPeriod = async (p) => {
    setActivePeriod(p); setLoading(true);
    const [s, pays] = await Promise.all([getStudents(false), getPayments(p.id)]);
    setStudents(s); setPayments(pays); setLoading(false); setPage(1);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!activePeriod) return;
    try {
      await createPayment({ ...form, studentId: form.studentId, periodId: activePeriod.id, amount: parseFloat(form.amount), receiptPath: form.receiptPath || null });
      setShowAdd(false);
      setForm({ studentId: '', amount: '', date: todayISO(), method: 'TUNAI', notes: '', receiptPath: '' });
      setPayments(await getPayments(activePeriod.id));
    } catch (err) { alert(err.response?.data?.message || 'Gagal'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus pembayaran ini?')) return;
    try { await deletePayment(id); setPayments(await getPayments(activePeriod.id)); }
    catch { alert('Gagal'); }
  };

  const handleExportExcel = () => {
    const { headers, rows } = prepareExportData(payments, [
      { label: 'Santri', render: p => studentMap[p.studentId]?.name || 'Unknown' },
      { label: 'Tgl', render: p => formatDateIndonesian(p.date) },
      { label: 'Metode', key: 'method' },
      { label: 'Jumlah', render: p => p.amount },
      { label: 'Catatan', render: p => p.notes || '-' },
    ]);
    exportToExcel({ title: 'Pembayaran', headers, rows, filename: `Pembayaran_${activePeriod.name.replace(/\s/g,'_')}` });
  };

  const handleExportPDF = () => {
    const { headers, rows } = prepareExportData(payments, [
      { label: 'Santri', render: p => studentMap[p.studentId]?.name || 'Unknown' },
      { label: 'Tgl', render: p => formatDateIndonesian(p.date) },
      { label: 'Metode', key: 'method' },
      { label: 'Jumlah', render: p => `Rp${p.amount.toLocaleString('id-ID')}` },
    ]);
    exportToPDF({
      title: 'Pembayaran', subtitle: activePeriod.name,
      headers, rows, filename: `Pembayaran_${activePeriod.name.replace(/\s/g,'_')}`, orientation: 'landscape'
    });
  };

  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s; });

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.room.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const columns = [
    {
      label: 'Santri', render: row => {
        const s = studentMap[row.studentId];
        return <span className="font-bold">{s?.name || 'Unknown'}</span>;
      }
    },
    { label: 'Tgl', render: row => formatDateIndonesian(row.date) },
    { label: 'Metode', render: row => row.method, width: '90px' },
    { label: 'Jumlah', align: 'right', render: row => <span className="text-neo-green font-bold">{formatRupiah(row.amount)}</span> },
    {
      label: 'Bukti', align: 'center', width: '80px',
      render: row => row.receiptPath ? (
        <button onClick={e => { e.stopPropagation(); setReceiptModal(row.receiptPath); }}
          className="btn-press inline-flex items-center gap-1 text-[11px] font-bold text-neo-primary px-2.5 py-1.5 border border-neo-primary/30 rounded-lg hover:bg-blue-50 transition">
          <PhotoIcon className="w-3.5 h-3.5" />
          BUKTI
        </button>
      ) : <span className="text-gray-300">—</span>
    },
    {
      label: '', align: 'center', width: '80px',
      render: row => (
        <button onClick={e => { e.stopPropagation(); handleDelete(row.id); }}
          className="btn-press inline-flex items-center gap-1 text-[11px] font-bold text-neo-red px-2.5 py-1.5 border border-neo-red/30 rounded-lg hover:bg-red-50 transition">
          <TrashIcon className="w-3.5 h-3.5" />
          HAPUS
        </button>
      )
    },
  ];

  const totalPages = Math.ceil(payments.length / perPage);
  const pageData = payments.slice((page - 1) * perPage, page * perPage);

  if (loading) return <div className="p-8 text-center"><div className="inline-block h-8 w-8 border-4 border-neo-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!activePeriod) return <div className="p-8 text-center text-gray-500 font-bold">Tidak ada periode aktif</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <CreditCardIcon className="w-5 h-5 text-neo-primary" />
          <h2 className="text-lg font-bold text-neo-text-primary">Pembayaran</h2>
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
          <div className="bg-white border-2 border-neo-border rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5 text-neo-primary" />
                <h3 className="text-base font-bold text-neo-text-primary">Tambah Pembayaran</h3>
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
                  <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition"
                    placeholder="Nama..." />
                </div>
                <div className="max-h-32 overflow-y-auto border-2 border-neo-border rounded-xl divide-y divide-gray-100">
                  {filteredStudents.map(s => (
                    <div key={s.id} onClick={() => { setForm({...form, studentId: s.id}); setStudentSearch(s.name); }}
                      className={`px-3 py-2.5 text-sm font-semibold cursor-pointer transition ${
                        form.studentId === s.id ? 'bg-neo-primary text-white' : 'hover:bg-gray-50 text-neo-text-primary'
                      }`}>
                      {s.name} — <span className="font-medium">{s.room}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Jumlah</label>
                  <RupiahInput value={form.amount} onChange={v => setForm({...form, amount: v})} required />
                  </div>
                <div>
                  <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Tanggal</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Metode</label>
                  <select value={form.method} onChange={e => setForm({...form, method: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition">
                    <option>TUNAI</option><option>TRANSFER</option><option>LAINNYA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Catatan</label>
                  <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">
                  Bukti Transfer <span className="font-normal text-gray-400">(max 500KB)</span>
                </label>
                <input type="file" accept="image/*" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setForm({...form, receiptPath: await fileToBase64(f)});
                }} className="w-full text-sm" />
                {form.receiptPath && (
                  <div className="mt-1 flex items-center gap-2">
                    <img src={form.receiptPath} className="h-10 w-10 object-cover border-2 border-neo-border rounded-lg" />
                    <button type="button" onClick={() => setForm({...form, receiptPath: ''})}
                      className="text-xs font-bold text-neo-red hover:underline">HAPUS</button>
                  </div>
                )}
              </div>

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

      <DataTable columns={columns} data={pageData}
        onRowClick={row => navigate(`/students/${row.studentId}`)}
        page={page} totalPages={totalPages} onPageChange={setPage}
        emptyMessage="Belum ada pembayaran" />

      {/* Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReceiptModal(null)}>
          <div className="bg-white border-2 border-neo-border rounded-2xl p-4 max-w-lg w-full max-h-[80vh] overflow-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <PhotoIcon className="w-4 h-4 text-neo-primary" />
                <span className="text-xs font-bold text-neo-text-secondary tracking-[0.06em] uppercase">Bukti Pembayaran</span>
              </div>
              <button onClick={() => setReceiptModal(null)} className="p-1 rounded-lg hover:bg-gray-100 transition">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <img src={receiptModal} className="w-full object-contain rounded-xl" alt="Bukti Transfer" />
            <button onClick={() => setReceiptModal(null)}
              className="btn-press mt-3 w-full py-2.5 border-2 border-neo-border rounded-xl text-xs font-bold hover:bg-gray-50 transition">
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
