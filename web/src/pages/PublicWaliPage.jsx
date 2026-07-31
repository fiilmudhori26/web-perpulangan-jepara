import { useState } from 'react';
import { Link } from 'react-router-dom';
import { searchSantri } from '../api/public';
import { formatRupiah, formatDateIndonesian } from '../lib/utils';
import Badge from '../components/Badge';

import { MagnifyingGlassIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';

export default function PublicWaliPage() {
  const [studentName, setStudentName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!studentName.trim() || !guardianPhone.trim()) {
      setError('Nama santri dan nomor wali harus diisi');
      return;
    }
    setLoading(true);
    try {
      const data = await searchSantri(studentName.trim(), guardianPhone.trim());
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Data santri tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  const statusVariant = (status) => {
    if (status === 'LUNAS') return 'lunas';
    if (status === 'BELUM BAYAR') return 'belum bayar';
    return 'dp';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 border-2 border-white rounded-full" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 border-2 border-white rounded-full" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>
      {/* Gold accent line top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neo-gold to-transparent" />

      <div className="w-full max-w-lg relative">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="Logo" className="h-20 w-20 mx-auto mb-4 rounded-2xl object-cover shadow-2xl ring-4 ring-white/10" onError={(e) => { e.target.style.display = 'none' }} />
          <h1 className="text-3xl font-black text-white">Sistem Perpulangan</h1>
          <p className="text-sm font-medium text-emerald-300/70 mt-1">Pondok Pesantren</p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.1em] uppercase mb-1.5">Nama Santri</label>
              <input
                value={studentName} onChange={e => setStudentName(e.target.value)}
                className="w-full px-3.5 py-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary focus:ring-2 focus:ring-neo-primary/20 transition bg-stone-50"
                placeholder="Masukkan nama santri"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.1em] uppercase mb-1.5">No. HP Wali</label>
              <input
                value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)}
                className="w-full px-3.5 py-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary focus:ring-2 focus:ring-neo-primary/20 transition bg-stone-50"
                placeholder="08xxxxxxx"
              />
            </div>
            <button type="submit" disabled={loading}
              className="btn-press w-full py-3 bg-gradient-to-r from-neo-primary to-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-900/30 hover:shadow-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Mencari...
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="w-4 h-4" />
                  Cari Data Santri
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600 text-center">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-3">
              {/* Student Info */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <UserCircleIcon className="w-10 h-10 text-neo-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-black text-neo-text-primary">{result.studentName}</h3>
                    <p className="text-xs font-semibold text-neo-text-secondary">Kamar: {result.room} &bull; No. Wali: {result.guardianPhone}</p>
                  </div>
                </div>
              </div>

              {/* Homecoming Status */}
              <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-sm">
                <h4 className="text-[10px] font-bold text-neo-text-secondary tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5">
                  <TruckIcon className="w-3.5 h-3.5" />
                  Status Perpulangan
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-semibold text-gray-500">Periode:</div>
                  <div className="font-bold text-neo-text-primary">{result.periodName}</div>
                  <div className="font-semibold text-gray-500">Rencana:</div>
                  <div className="font-bold text-neo-text-primary">{result.plan}</div>
                  <div className="font-semibold text-gray-500">Keberangkatan:</div>
                  <div className="font-bold text-neo-text-primary">{formatDateIndonesian(result.departureDate)}</div>
                  <div className="font-semibold text-gray-500">Batas Kembali:</div>
                  <div className="font-bold text-neo-text-primary">{formatDateIndonesian(result.mandatoryReturnDate)}</div>
                  {result.actualReturnDate && (
                    <>
                      <div className="font-semibold text-gray-500">Tgl Kembali:</div>
                      <div className="font-bold text-neo-green">{formatDateIndonesian(result.actualReturnDate)}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-sm">
                <h4 className="text-[10px] font-bold text-neo-text-secondary tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5">
                  <BanknotesIcon className="w-3.5 h-3.5" />
                  Informasi Pembayaran
                </h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-500">Biaya:</span>
                    <span className="font-bold">{formatRupiah(result.feeAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-500">Dibayar:</span>
                    <span className="font-bold text-neo-green">{formatRupiah(result.totalPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-500">Sisa:</span>
                    <span className="font-bold text-red-500">{formatRupiah(result.remainingFee)}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-stone-100 flex justify-between items-center">
                    <span className="font-semibold text-gray-500">Status:</span>
                    <Badge variant={statusVariant(result.paymentStatus)}>{result.paymentStatus}</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer link */}
          <div className="mt-6 pt-4 border-t border-stone-100 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-neo-primary hover:text-neo-primary-dark transition">
              <ShieldCheckIcon className="w-4 h-4" />
              Login Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline icons used above
function TruckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}
function BanknotesIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}
