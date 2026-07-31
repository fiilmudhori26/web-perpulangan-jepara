import { useState, useEffect } from 'react';
import { getPeriods } from '../api/periods';
import { getFinanceSummary, getIncomes, createIncome, getExpenses, createExpense } from '../api/finance';
import { formatRupiah, formatDateIndonesian, todayISO } from '../lib/utils';
import DataTable from '../components/DataTable';
import RupiahInput from '../components/RupiahInput';

import { exportToExcel, exportToPDF, prepareExportData } from '../lib/export';

import {
  BanknotesIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

export default function FinancePage() {
  const [periods, setPeriods] = useState([]);
  const [activePeriod, setActivePeriod] = useState(null);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0, studentPaymentIncome: 0, otherIncome: 0 });
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('income');
  const [form, setForm] = useState({ date: todayISO(), category: '', description: '', amount: '' });
  const [page, setPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    getPeriods().then(all => {
      setPeriods(all);
      const active = all.find(p => p.isActive);
      if (active) { setActivePeriod(active); fetchFinance(active.id); }
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const fetchFinance = async (periodId) => {
    try {
      const [sum, inc, exp] = await Promise.all([getFinanceSummary(periodId), getIncomes(periodId), getExpenses(periodId)]);
      setSummary(sum); setIncomes(inc); setExpenses(exp);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const switchPeriod = async (p) => { setActivePeriod(p); setLoading(true); await fetchFinance(p.id); setPage(1); };

  const handleExportExcel = () => {
    const source = tab === 'all' ? allTransactions : filtered;
    const { headers, rows } = prepareExportData(source, [
      { label: 'Tgl', render: t => formatDateIndonesian(t.date) },
      { label: 'Kategori', key: 'category' },
      { label: 'Deskripsi', key: 'description' },
      { label: 'Jumlah', render: t => t.type === 'PEMASUKAN' ? t.amount : -t.amount },
      { label: 'Tipe', key: 'type' },
    ]);
    exportToExcel({ title: 'Keuangan', headers, rows, filename: `Keuangan_${activePeriod.name.replace(/\s/g,'_')}` });
  };

  const handleExportPDF = () => {
    const source = tab === 'all' ? allTransactions : filtered;
    const { headers, rows } = prepareExportData(source, [
      { label: 'Tgl', render: t => formatDateIndonesian(t.date) },
      { label: 'Kategori', key: 'category' },
      { label: 'Deskripsi', key: 'description' },
      { label: 'Jumlah', render: t => `${t.type === 'PEMASUKAN' ? '+' : '-'}Rp${t.amount.toLocaleString('id-ID')}` },
      { label: 'Tipe', key: 'type' },
    ]);
    exportToPDF({
      title: 'Keuangan', subtitle: `${activePeriod.name} (${tab === 'income' ? 'Pemasukan' : tab === 'expense' ? 'Pengeluaran' : 'Semua Transaksi'})`,
      headers, rows, filename: `Keuangan_${activePeriod.name.replace(/\s/g,'_')}`, orientation: 'landscape',
    });
  };

  const openModal = (type) => { setModalType(type); setForm({ date: todayISO(), category: '', description: '', amount: '' }); setShowModal(true); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!activePeriod) return;
    try {
      const payload = { ...form, periodId: activePeriod.id, amount: parseFloat(form.amount) };
      if (modalType === 'income') await createIncome(payload); else await createExpense(payload);
      setShowModal(false); await fetchFinance(activePeriod.id);
    } catch (err) { alert(err.response?.data?.message || 'Gagal'); }
  };

  const allTransactions = [
    ...incomes.map(i => ({ ...i, type: 'PEMASUKAN' })),
    ...expenses.map(e => ({ ...e, type: 'PENGELUARAN' })),
  ].sort((a, b) => b.createdAt - a.createdAt);

  const filtered = tab === 'income' ? incomes.map(i => ({ ...i, type: 'PEMASUKAN' }))
    : tab === 'expense' ? expenses.map(e => ({ ...e, type: 'PENGELUARAN' }))
    : allTransactions;

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  const columns = [
    { label: 'Tgl', render: row => formatDateIndonesian(row.date), width: '110px' },
    { label: 'Kategori', render: row => row.category, width: '150px' },
    { label: 'Deskripsi', render: row => row.description },
    {
      label: 'Jumlah', align: 'right',
      render: row => (
        <span className={row.type === 'PEMASUKAN' ? 'text-neo-green font-bold' : 'text-neo-red font-bold'}>
          {row.type === 'PEMASUKAN' ? '+' : '-'}{formatRupiah(row.amount)}
        </span>
      )
    },
    {
      label: 'Tipe', align: 'center', width: '100px',
      render: row => (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-full ${
          row.type === 'PEMASUKAN' ? 'bg-green-50 text-green-700 border border-green-300' : 'bg-red-50 text-red-700 border border-red-300'
        }`}>
          {row.type === 'PEMASUKAN' ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
          {row.type}
        </span>
      )
    },
  ];

  if (loading) return <div className="p-8 text-center"><div className="inline-block h-8 w-8 border-4 border-neo-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!activePeriod) return <div className="p-8 text-center text-gray-500 font-bold">Tidak ada periode aktif</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <BanknotesIcon className="w-5 h-5 text-neo-primary" />
          <h2 className="text-lg font-bold text-neo-text-primary">Keuangan</h2>
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pemasukan', value: formatRupiah(summary.totalIncome), color: 'text-neo-green', bg: 'bg-green-50', border: 'border-green-200', icon: ArrowTrendingUpIcon },
          { label: 'Pengeluaran', value: formatRupiah(summary.totalExpense), color: 'text-neo-red', bg: 'bg-red-50', border: 'border-red-200', icon: ArrowTrendingDownIcon },
          { label: 'Saldo', value: formatRupiah(summary.balance), color: summary.balance >= 0 ? 'text-neo-green' : 'text-neo-red', bg: summary.balance >= 0 ? 'bg-green-50' : 'bg-red-50', border: summary.balance >= 0 ? 'border-green-200' : 'border-red-200', icon: BanknotesIcon },
          { label: 'Pemb. Santri', value: formatRupiah(summary.studentPaymentIncome), color: 'text-neo-primary', bg: 'bg-blue-50', border: 'border-blue-200', icon: CalendarDaysIcon },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`${s.bg} ${s.border} border-2 rounded-xl p-4 card-hover`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.08em]">{s.label}</span>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs + Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'all', label: 'Semua' },
          { key: 'income', label: 'Pemasukan' },
          { key: 'expense', label: 'Pengeluaran' },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }}
            className={`btn-press px-4 py-2 text-xs font-bold rounded-xl border-2 transition ${
              tab === t.key
                ? 'bg-neo-primary text-white border-neo-primary-dark shadow-sm'
                : 'bg-white text-neo-text-primary border-neo-border hover:bg-gray-50'
            }`}>{t.label}</button>
        ))}
        <div className="flex-1" />
        <button onClick={() => openModal('income')}
          className="btn-press inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-neo-green to-green-700 text-white text-xs font-bold rounded-xl border-2 border-green-800 hover:brightness-110 transition">
          <PlusIcon className="w-3.5 h-3.5" />
          Pemasukan
        </button>
        <button onClick={() => openModal('expense')}
          className="btn-press inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-neo-red to-red-700 text-white text-xs font-bold rounded-xl border-2 border-red-800 hover:brightness-110 transition">
          <PlusIcon className="w-3.5 h-3.5" />
          Pengeluaran
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white border-2 border-neo-border rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                {modalType === 'income' ? (
                  <ArrowTrendingUpIcon className="w-5 h-5 text-neo-green" />
                ) : (
                  <ArrowTrendingDownIcon className="w-5 h-5 text-neo-red" />
                )}
                <h3 className="text-base font-bold text-neo-text-primary">
                  {modalType === 'income' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 transition">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Tanggal</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                  className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition" required />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Kategori</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition" required>
                  <option value="">Pilih kategori</option>
                  <option>Pembayaran Santri</option><option>Donasi</option><option>Operasional</option>
                  <option>Konsumsi</option><option>Transportasi</option><option>Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Deskripsi</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary transition" required />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">Jumlah</label>
                <RupiahInput value={form.amount} onChange={v => setForm({...form, amount: v})} required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit"
                  className="btn-press flex-1 py-2.5 bg-gradient-to-r from-neo-primary to-neo-primary-dark text-white text-sm font-bold rounded-xl border-2 border-neo-primary-dark hover:brightness-110 transition flex items-center justify-center gap-1.5">
                  <CheckCircleIcon className="w-4 h-4" />
                  Simpan
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="btn-press px-5 py-2.5 border-2 border-neo-border rounded-xl text-sm font-bold text-neo-text-primary hover:bg-gray-50 transition">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DataTable columns={columns} data={pageData}
        page={page} totalPages={totalPages} onPageChange={setPage}
        emptyMessage="Belum ada transaksi" />
    </div>
  );
}
