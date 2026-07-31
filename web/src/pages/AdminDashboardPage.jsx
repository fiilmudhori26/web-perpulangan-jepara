import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPeriods } from '../api/periods';
import { getStudents } from '../api/students';
import { getPayments } from '../api/payments';
import { getFinanceSummary, getIncomes, getExpenses } from '../api/finance';
import { getHomecomings } from '../api/homecomings';
import { formatRupiah, formatDateIndonesian } from '../lib/utils';

import {
  UsersIcon,
  TruckIcon,
  HomeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
  BanknotesIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

import { CurrencyDollarIcon } from '@heroicons/react/24/solid';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState([]);
  const [activePeriod, setActivePeriod] = useState(null);
  const [students, setStudents] = useState([]);
  const [homecomings, setHomecomings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (periodId) => {
    setLoading(true);
    try {
      const [s, h, p, sum, inc, exp] = await Promise.all([
        getStudents(false),
        getHomecomings(periodId),
        getPayments(periodId),
        getFinanceSummary(periodId),
        getIncomes(periodId),
        getExpenses(periodId),
      ]);
      setStudents(s);
      setHomecomings(h);
      setPayments(p);
      setSummary(sum);

      const tx = [
        ...inc.map(i => ({ ...i, type: 'PEMASUKAN' })),
        ...exp.map(e => ({ ...e, type: 'PENGELUARAN' })),
      ].sort((a, b) => b.createdAt - a.createdAt);
      setTransactions(tx);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPeriods().then(all => {
      setPeriods(all);
      const active = all.find(p => p.isActive);
      if (active) {
        setActivePeriod(active);
        fetchData(active.id);
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, []);

  const switchPeriod = async (p) => {
    setActivePeriod(p);
    fetchData(p.id);
  };

  const akanPulang = homecomings.filter(h => h.plan === 'AKAN PULANG').length;
  const tidakPulang = homecomings.filter(h => h.plan === 'TIDAK PULANG').length;
  const totalSantri = students.length;

  const studentMap = {};
  const homecomingMap = {};
  students.forEach(s => { studentMap[s.id] = s; });
  homecomings.forEach(h => { homecomingMap[h.studentId] = h; });

  const studentPaymentMap = {};
  payments.forEach(p => {
    studentPaymentMap[p.studentId] = (studentPaymentMap[p.studentId] || 0) + p.amount;
  });

  const perluBayar = students.filter(s => {
    const hc = homecomingMap[s.id];
    return !hc || hc.plan !== 'TIDAK PULANG';
  });
  const lunas = perluBayar.filter(s => (studentPaymentMap[s.id] || 0) >= (activePeriod?.feeAmount || 0)).length;
  const belumLunas = perluBayar.length - lunas;

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        {[1,2,3].map(i => (
          <div key={i} className="h-24 bg-white rounded-xl shadow-sm skeleton-pulse" />
        ))}
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, accentColor, onClick, subtitle }) => (
    <div
      onClick={onClick}
      className="stat-card relative bg-white rounded-xl shadow-sm p-4 cursor-pointer card-hover border border-stone-100"
      style={{ '--accent-color': accentColor }}
    >
      <div className="absolute top-0 left-0 w-full h-1 rounded-t-xl" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }} />
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-neo-text-secondary tracking-[0.1em] uppercase mb-0.5">{title}</div>
          <div className="text-2xl font-black text-neo-text-primary">{value}</div>
          {subtitle && <div className="text-[11px] font-medium text-gray-400 mt-0.5">{subtitle}</div>}
        </div>
        <div className={`flex-shrink-0 p-2.5 rounded-lg`} style={{ background: `${accentColor}12` }}>
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Active Period Banner */}
      {activePeriod && (
        <div className="bg-gradient-to-r from-neo-primary to-emerald-800 rounded-xl shadow-lg p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-100/70">Periode Aktif</div>
              <div className="text-lg font-black text-white">{activePeriod.name}</div>
              <div className="text-xs font-medium text-emerald-100/80 mt-0.5">
                Biaya: {formatRupiah(activePeriod.feeAmount)}
                <span className="mx-2">&bull;</span>
                Batas Kembali: {formatDateIndonesian(activePeriod.returnDeadlineDate)}
              </div>
            </div>
            <select
              onChange={e => {
                const p = periods.find(x => x.id === e.target.value);
                if (p) switchPeriod(p);
              }}
              value={activePeriod.id}
              className="flex-shrink-0 text-xs font-bold text-neo-text-primary bg-white/95 border border-emerald-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.isActive ? ' (Aktif)' : ''}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Total Santri" value={totalSantri}
          icon={UsersIcon} color="#0d9488" accentColor="#0d9488"
          subtitle="Terdaftar aktif"
        />
        <StatCard
          title="Akan Pulang" value={akanPulang}
          icon={TruckIcon} color="#059669" accentColor="#059669"
          subtitle={`${totalSantri - tidakPulang} santri pulang`}
        />
        <StatCard
          title="Tidak Pulang" value={tidakPulang}
          icon={HomeIcon} color="#dc2626" accentColor="#dc2626"
          subtitle="Tetap di pondok"
        />
        <StatCard
          title="Lunas" value={lunas}
          icon={CheckCircleIcon} color="#059669" accentColor="#059669"
          subtitle={belumLunas > 0 ? `${belumLunas} belum lunas` : 'Semua lunas'}
        />
        <StatCard
          title="Belum Lunas" value={belumLunas}
          icon={ExclamationTriangleIcon} color="#ca8a04" accentColor="#d97706"
          subtitle="Perlu tindak lanjut"
        />
        <StatCard
          title="Saldo Akhir" value={formatRupiah(summary.balance)}
          icon={CurrencyDollarIcon} color="#0d9488" accentColor="#0d9488"
          subtitle={summary.balance >= 0 ? 'Positif' : 'Defisit'}
        />
        <StatCard
          title="Pemasukan" value={formatRupiah(summary.totalIncome)}
          icon={ArrowTrendingUpIcon} color="#059669" accentColor="#059669"
          subtitle="Total periode ini"
        />
        <StatCard
          title="Pengeluaran" value={formatRupiah(summary.totalExpense)}
          icon={ArrowTrendingDownIcon} color="#dc2626" accentColor="#dc2626"
          subtitle="Total periode ini"
        />
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-xs font-bold text-neo-text-primary tracking-[0.08em] uppercase mb-3">Akses Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: 'Data Santri', icon: UsersIcon, to: '/students', color: '#0d9488' },
            { label: 'Perpulangan', icon: TruckIcon, to: '/homecoming', color: '#059669' },
            { label: 'Pembayaran', icon: CreditCardIcon, to: '/payments', color: '#0d9488' },
            { label: 'Keuangan', icon: BanknotesIcon, to: '/finance', color: '#d97706' },
          ].map(btn => {
            const Icon = btn.icon;
            return (
              <button key={btn.to} onClick={() => navigate(btn.to)}
                className="btn-press flex items-center gap-2.5 bg-white border border-stone-100 rounded-xl p-3.5 text-sm font-bold text-neo-text-primary hover:bg-stone-50 transition card-hover shadow-sm"
              >
                <div className="p-1.5 rounded-lg" style={{ background: `${btn.color}12` }}>
                  <Icon className="w-4 h-4" style={{ color: btn.color }} />
                </div>
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Payments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neo-text-primary tracking-[0.08em] uppercase">Pembayaran Terbaru</span>
            <button onClick={() => navigate('/payments')} className="text-[11px] font-semibold text-neo-primary hover:text-neo-primary-dark transition">
              Lihat Semua &rarr;
            </button>
          </div>
          <div className="space-y-2">
            {payments.length === 0 ? (
              <div className="bg-white border border-stone-100 rounded-xl p-5 text-center shadow-sm">
                <div className="text-gray-300 mb-1">
                  <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-400">Belum ada pembayaran</span>
              </div>
            ) : (
              payments.slice(0, 3).map((p, i) => (
                <div key={p.id} className="bg-white border border-stone-100 rounded-xl p-3.5 flex items-center justify-between card-hover shadow-sm" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <CheckCircleIcon className="w-4 h-4 text-neo-green" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-neo-text-primary truncate">{studentMap[p.studentId]?.name || 'Santri'}</div>
                      <div className="text-[11px] font-medium text-gray-400">{formatDateIndonesian(p.date)} &bull; {p.method}</div>
                    </div>
                  </div>
                  <span className="text-sm font-black text-neo-green flex-shrink-0">+{formatRupiah(p.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neo-text-primary tracking-[0.08em] uppercase">Transaksi Keuangan</span>
            <button onClick={() => navigate('/finance')} className="text-[11px] font-semibold text-neo-primary hover:text-neo-primary-dark transition">
              Lihat Semua &rarr;
            </button>
          </div>
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <div className="bg-white border border-stone-100 rounded-xl p-5 text-center shadow-sm">
                <div className="text-gray-300 mb-1">
                  <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.078.879 4.249 0a3.45 3.45 0 012.745-.566M12 6a3.45 3.45 0 01-1.803.566M12 6a3.45 3.45 0 00-1.803-.566m0 0A3.444 3.444 0 018.25 6.75M12 6a3.448 3.448 0 013.248 4.033M12 6v12" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-400">Belum ada transaksi</span>
              </div>
            ) : (
              transactions.slice(0, 3).map((tx, i) => (
                <div key={tx.id} className="bg-white border border-stone-100 rounded-xl p-3.5 flex items-center justify-between card-hover shadow-sm" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${tx.type === 'PEMASUKAN' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {tx.type === 'PEMASUKAN' ? (
                        <ArrowTrendingUpIcon className="w-4 h-4 text-neo-green" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-4 h-4 text-neo-red" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-neo-text-primary truncate">{tx.description}</div>
                      <div className="text-[11px] font-medium text-gray-400">{formatDateIndonesian(tx.date)} &bull; {tx.category}</div>
                    </div>
                  </div>
                  <span className={`text-sm font-black flex-shrink-0 ml-2 ${tx.type === 'PEMASUKAN' ? 'text-neo-green' : 'text-neo-red'}`}>
                    {tx.type === 'PEMASUKAN' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
