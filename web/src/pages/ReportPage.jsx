import { useState, useEffect } from 'react';
import { getPeriods } from '../api/periods';
import { getStudents } from '../api/students';
import { getPayments } from '../api/payments';
import { getHomecomings } from '../api/homecomings';
import { getFinanceSummary, getIncomes, getExpenses } from '../api/finance';
import { formatRupiah, formatDateIndonesian } from '../lib/utils';
import { exportToExcel, exportToPDF, prepareExportData } from '../lib/export';

import {
  DocumentChartBarIcon,
  PrinterIcon,
  CheckCircleIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

export default function ReportPage() {
  const [periods, setPeriods] = useState([]);
  const [activePeriod, setActivePeriod] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPeriods().then(all => {
      setPeriods(all);
      const active = all.find(p => p.isActive);
      if (active) { setActivePeriod(active); generateReport(active.id); }
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const generateReport = async (periodId) => {
    setLoading(true);
    try {
      const [students, payments, homecomings, summary, incomes, expenses] = await Promise.all([
        getStudents(false), getPayments(periodId), getHomecomings(periodId),
        getFinanceSummary(periodId), getIncomes(periodId), getExpenses(periodId),
      ]);

      const paymentTotals = {};
      students.forEach(s => { paymentTotals[s.id] = 0; });
      payments.forEach(p => { paymentTotals[p.studentId] = (paymentTotals[p.studentId] || 0) + p.amount; });

      const homecomingMap = {};
      homecomings.forEach(h => { homecomingMap[h.studentId] = h; });

      const fee = activePeriod?.feeAmount || 0;
      const statuses = students.map(s => {
        const total = paymentTotals[s.id] || 0;
        const status = total <= 0 ? 'BELUM BAYAR' : total >= fee ? 'LUNAS' : 'DP';
        return { ...s, totalPaid: total, status, homecoming: homecomingMap[s.id] || null };
      });

      const perluBayar = statuses.filter(s => {
        const hc = homecomingMap[s.studentId || s.id];
        return !hc || hc.plan !== 'TIDAK PULANG';
      });

      setData({
        students, statuses, payments, homecomings, summary, incomes, expenses,
        totalSantri: students.length,
        akanPulang: homecomings.filter(h => h.plan === 'AKAN PULANG').length,
        tidakPulang: homecomings.filter(h => h.plan === 'TIDAK PULANG').length,
        lunas: perluBayar.filter(s => s.status === 'LUNAS').length,
        belumLunas: perluBayar.filter(s => s.status !== 'LUNAS').length,
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const switchPeriod = async (p) => { setActivePeriod(p); generateReport(p.id); };

  const handleExportExcel = () => {
    if (!data) return;
    const { headers, rows } = prepareExportData(data.statuses, [
      { label: 'Nama', key: 'name' },
      { label: 'Kamar', key: 'room' },
      { label: 'Dibayar', render: s => s.totalPaid },
      { label: 'Status', key: 'status' },
      { label: 'Rencana Pulang', render: s => s.homecoming?.plan || '-' },
    ]);
    exportToExcel({ title: 'Laporan Perpulangan', headers, rows, filename: `Laporan_${activePeriod.name.replace(/\s/g,'_')}` });
  };

  const handleExportPDF = () => {
    if (!data) return;
    const { headers, rows } = prepareExportData(data.statuses, [
      { label: 'Nama', key: 'name' },
      { label: 'Kamar', key: 'room' },
      { label: 'Dibayar', render: s => `Rp${s.totalPaid.toLocaleString('id-ID')}` },
      { label: 'Status', key: 'status' },
      { label: 'Rencana Pulang', render: s => s.homecoming?.plan || '-' },
    ]);
    exportToPDF({
      title: 'Laporan Perpulangan Santri', subtitle: `Pondok Pesantren — ${activePeriod.name}`,
      headers, rows, filename: `Laporan_${activePeriod.name.replace(/\s/g,'_')}`,
    });
  };

  if (loading) return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-white border-2 border-neo-border rounded-xl skeleton-pulse" />)}
    </div>
  );
  if (!activePeriod || !data) return <div className="p-8 text-center text-gray-500 font-bold">Tidak ada periode aktif</div>;

  const returned = data.homecomings.filter(h => h.actualReturnDate);

  const statusBadge = (status) => {
    const styles = {
      'LUNAS': 'bg-green-50 border border-green-300 text-green-700',
      'BELUM BAYAR': 'bg-red-50 border border-red-300 text-red-700',
      'DP': 'bg-yellow-50 border border-yellow-300 text-yellow-700',
    };
    return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full ${styles[status] || 'bg-gray-50 border border-gray-300 text-gray-600'}`}>
      <CheckCircleIcon className="w-3 h-3" />
      {status}
    </span>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <DocumentChartBarIcon className="w-6 h-6 text-neo-primary" />
          <div>
            <h2 className="text-lg font-black text-neo-text-primary">Laporan</h2>
            <select onChange={e => { const p = periods.find(x => x.id === e.target.value); if (p) switchPeriod(p); }}
              value={activePeriod.id}
              className="text-[11px] font-bold border-2 border-neo-border rounded-lg px-2.5 py-1 mt-0.5 focus:outline-none focus:border-neo-primary">
              {periods.map(p => <option key={p.id} value={p.id}>{p.name}{p.isActive ? ' (Aktif)' : ''}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel}
            className="btn-press inline-flex items-center gap-1.5 px-3 py-2 border-2 border-neo-border rounded-xl text-xs font-bold text-neo-text-primary hover:bg-gray-50 transition">
            <DocumentArrowDownIcon className="w-4 h-4" />
            Excel
          </button>
          <button onClick={handleExportPDF}
            className="btn-press inline-flex items-center gap-1.5 px-3 py-2 border-2 border-neo-border rounded-xl text-xs font-bold text-neo-text-primary hover:bg-gray-50 transition">
            <DocumentArrowDownIcon className="w-4 h-4" />
            PDF
          </button>
          <button onClick={() => window.print()}
            className="btn-press flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neo-primary to-neo-primary-dark text-white text-sm font-bold rounded-xl border-2 border-neo-primary-dark hover:brightness-110 transition">
            <PrinterIcon className="w-4 h-4" />
            Cetak
          </button>
        </div>
      </div>

      {/* Report Card */}
      <div className="bg-white border-2 border-neo-border rounded-2xl p-6 shadow-sm">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-200 pb-4 mb-5">
          <h3 className="text-lg font-black text-neo-text-primary">Laporan Perpulangan Santri</h3>
          <p className="text-sm font-semibold text-gray-500">Pondok Pesantren</p>
          <p className="text-sm font-bold text-neo-primary mt-1">{activePeriod.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatBox label="Total Santri" value={data.totalSantri} bg="bg-gray-50" text="text-gray-800" />
          <StatBox label="Lunas" value={data.lunas} bg="bg-green-50" text="text-green-800" />
          <StatBox label="Belum Lunas" value={data.belumLunas} bg="bg-red-50" text="text-red-800" />
          <StatBox label="Akan Pulang" value={data.akanPulang} bg="bg-blue-50" text="text-blue-800" />
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <InfoBox label="Total Pemasukan" value={formatRupiah(data.summary.totalIncome)} text="text-green-700" icon={ArrowTrendingUpIcon} />
          <InfoBox label="Total Pengeluaran" value={formatRupiah(data.summary.totalExpense)} text="text-red-700" icon={ArrowTrendingDownIcon} />
          <InfoBox label="Saldo" value={formatRupiah(data.summary.balance)} text={data.summary.balance >= 0 ? 'text-green-700' : 'text-red-700'} icon={data.summary.balance >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon} />
        </div>

        {/* Payment Status Table */}
        <h4 className="text-sm font-bold text-neo-text-primary mb-3 flex items-center gap-2">
          <UsersIcon className="w-4 h-4 text-neo-primary" />
          Status Pembayaran Santri
        </h4>
        <div className="overflow-x-auto mb-6 rounded-lg border-2 border-neo-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-neo-border">
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-left tracking-[0.08em]">Nama</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-left tracking-[0.08em]">Kamar</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-right tracking-[0.08em]">Dibayar</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-center tracking-[0.08em]">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-center tracking-[0.08em]">Rencana Pulang</th>
              </tr>
            </thead>
            <tbody>
              {data.statuses.map((s, i) => (
                <tr key={s.id} className={`border-b border-gray-100 ${i % 2 ? 'bg-gray-50/30' : 'bg-white'}`}>
                  <td className="px-4 py-3 font-bold text-neo-text-primary">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-medium">{s.room}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatRupiah(s.totalPaid)}</td>
                  <td className="px-4 py-3 text-center">{statusBadge(s.status)}</td>
                  <td className="px-4 py-3 text-center text-xs font-bold text-gray-400">{s.homecoming?.plan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Returned Students */}
        {returned.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-neo-text-primary mb-3 flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-neo-green" />
              Santri Yang Sudah Kembali
            </h4>
            <div className="overflow-x-auto rounded-lg border-2 border-neo-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-neo-border">
                    <th className="px-4 py-3 text-[10px] font-bold uppercase text-left tracking-[0.08em]">Nama</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase text-left tracking-[0.08em]">Tgl Kembali</th>
                  </tr>
                </thead>
                <tbody>
                  {returned.map((h, i) => {
                    const s = data.students.find(st => st.id === h.studentId);
                    return (
                    <tr key={h.id} className={`border-b border-gray-100 ${i % 2 ? 'bg-gray-50/30' : 'bg-white'}`}>
                      <td className="px-4 py-3 font-bold text-neo-text-primary">{s ? s.name : 'Unknown'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-green-50 border border-green-300 text-green-700">
                          <CheckCircleIcon className="w-3 h-3" />
                          {formatDateIndonesian(h.actualReturnDate)}
                        </span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, bg, text }) {
  return (
    <div className={`p-4 border-2 border-neo-border rounded-xl text-center ${bg}`}>
      <div className="text-[10px] font-bold text-gray-500 tracking-[0.08em] uppercase">{label}</div>
      <div className={`text-2xl font-black mt-0.5 ${text}`}>{value}</div>
    </div>
  );
}

function InfoBox({ label, value, text, icon: Icon }) {
  return (
    <div className="p-4 border-2 border-neo-border rounded-xl">
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <span className="text-[10px] font-bold text-gray-500 tracking-[0.08em] uppercase">{label}</span>
      </div>
      <div className={`text-base font-black ${text}`}>{value}</div>
    </div>
  );
}
