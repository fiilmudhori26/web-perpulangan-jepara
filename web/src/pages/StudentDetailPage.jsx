import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudent, updateStudent } from '../api/students';
import { getStudentPayments, createPayment, deletePayment } from '../api/payments';
import { getStudentHomecoming } from '../api/homecomings';
import { getPeriods } from '../api/periods';
import { formatRupiah, formatDateIndonesian, todayISO, fileToBase64 } from '../lib/utils';
import { exportToExcel, exportToPDF, prepareExportData } from '../lib/export';
import RupiahInput from '../components/RupiahInput';

import {
  ArrowLeftIcon,
  PencilSquareIcon,
  PlusIcon,
  XMarkIcon,
  PhotoIcon,
  TrashIcon,
  DocumentTextIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  CheckCircleIcon,
  TruckIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import {
  CheckBadgeIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/solid';

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [payments, setPayments] = useState([]);
  const [homecoming, setHomecoming] = useState(null);
  const [activePeriod, setActivePeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [showPayment, setShowPayment] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', date: todayISO(), method: 'TUNAI', notes: '', receiptPath: '' });
  const [receiptModal, setReceiptModal] = useState(null);

  useEffect(() => {
    Promise.all([
      getStudent(id),
      getPeriods(),
    ]).then(([s, p]) => {
      setStudent(s);
      setPeriods(p);
      const active = p.find(x => x.isActive);
      setActivePeriod(active);
      if (active) {
        getStudentPayments(id, active.id).then(setPayments);
        getStudentHomecoming(id, active.id).then(setHomecoming);
      }
    }).catch(() => navigate('/students'))
    .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateStudent(id, form);
      setStudent(updated);
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengupdate');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!activePeriod) return alert('Tidak ada periode aktif');
    try {
      await createPayment({
        studentId: id,
        periodId: activePeriod.id,
        amount: parseFloat(payForm.amount),
        date: payForm.date,
        method: payForm.method,
        notes: payForm.notes,
        receiptPath: payForm.receiptPath || null,
      });
      setShowPayment(false);
      setPayForm({ amount: '', date: todayISO(), method: 'TUNAI', notes: '', receiptPath: '' });
      const ps = await getStudentPayments(id, activePeriod.id);
      setPayments(ps);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan pembayaran');
    }
  };

  const handleDeletePayment = async (paymentId) => {
      if (!confirm('Hapus pembayaran ini?')) return;
      try {
        await deletePayment(paymentId);
        const ps = await getStudentPayments(id, activePeriod.id);
        setPayments(ps);
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal menghapus');
      }
    };

    const handleExportPaymentsExcel = () => {
      const { headers, rows } = prepareExportData(payments, [
        { label: 'Tgl', render: p => formatDateIndonesian(p.date) },
        { label: 'Metode', key: 'method' },
        { label: 'Jumlah', render: p => `Rp${p.amount.toLocaleString('id-ID')}` },
        { label: 'Catatan', render: p => p.notes || '-' },
        { label: 'Bukti', render: p => p.receiptPath ? 'Ada' : 'Tidak' },
      ]);
      exportToExcel({ title: 'Riwayat Pembayaran', headers, rows, filename: `Pembayaran_${student.name.replace(/\\s/g,'_')}_${activePeriod.name.replace(/\\s/g,'_')}` });
    };

    const handleExportPaymentsPDF = () => {
      const { headers, rows } = prepareExportData(payments, [
        { label: 'Tgl', render: p => formatDateIndonesian(p.date) },
        { label: 'Metode', key: 'method' },
        { label: 'Jumlah', render: p => `Rp${p.amount.toLocaleString('id-ID')}` },
        { label: 'Catatan', render: p => p.notes || '-' },
      ]);
      exportToPDF({
        title: 'Riwayat Pembayaran', subtitle: `${student.name} — ${activePeriod.name}`,
        headers, rows, filename: `Pembayaran_${student.name.replace(/\\s/g,'_')}_${activePeriod.name.replace(/\\s/g,'_')}`, orientation: 'landscape'
      });
    };

  if (loading) return <div className="p-8 text-center"><div className="inline-block h-8 w-8 border-4 border-neo-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!student) return <div className="p-8 text-center text-neo-red font-bold">Santri tidak ditemukan</div>;

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const baseFee = activePeriod?.feeAmount || 0;
  const planMultiplier = homecoming?.plan === 'PULANG PERGI' ? 2 : 1;
  const fee = baseFee * planMultiplier;
  const remaining = Math.max(0, fee - totalPaid);
  const status = totalPaid <= 0 ? 'BELUM BAYAR' : totalPaid >= fee ? 'LUNAS' : 'DP';
  const tidakPulang = homecoming?.plan === 'TIDAK PULANG';

  const planLabel = homecoming?.plan?.replace(/^PULANG /, '').toLowerCase() === 'ke rumah' ? 'Pulang ke Rumah'
    : homecoming?.plan === 'PULANG PERGI' ? 'Pulang Pergi (2× biaya)'
    : homecoming?.plan === 'PULANG KE PONDOK' ? 'Pulang ke Pondok'
    : homecoming?.plan === 'TIDAK PULANG' ? 'Tidak Pulang'
    : homecoming?.plan || '-';

  const statusStyle = (s) => {
    switch (s) {
      case 'LUNAS': return 'bg-green-50 text-green-700 border-green-300';
      case 'BELUM BAYAR': return 'bg-red-50 text-red-700 border-red-300';
      default: return 'bg-yellow-50 text-yellow-700 border-yellow-300';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Back button */}
      <button onClick={() => navigate('/students')}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-neo-primary hover:text-neo-primary-dark transition">
        <ArrowLeftIcon className="w-4 h-4" />
        Kembali
      </button>

      {/* Student Info Card */}
      <div className="bg-white border-2 border-neo-border rounded-xl p-5 card-hover">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <UserCircleIcon className="w-12 h-12 text-neo-primary flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-xl font-black text-neo-text-primary truncate">{student.name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                <span className="text-sm font-semibold text-gray-500">Kamar: <span className="font-bold text-neo-text-primary">{student.room}</span></span>
                <span className="text-sm font-semibold text-gray-500">HP Wali: <span className="font-bold text-neo-text-primary">{student.guardianPhone}</span></span>
              </div>
              {student.address && <p className="text-sm font-semibold text-gray-500 mt-0.5">Alamat: <span className="font-medium">{student.address}</span></p>}
              {student.emergencyContact && <p className="text-sm font-semibold text-gray-500 mt-0.5">Darurat: <span className="font-medium">{student.emergencyContact}</span></p>}
              {student.notes && <p className="text-sm text-gray-400 mt-1 italic">{student.notes}</p>}
            </div>
          </div>
          <button onClick={() => { setEditing(true); setForm(student); }}
            className="btn-press flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 border-2 border-neo-border rounded-xl text-xs font-bold text-neo-text-primary hover:bg-gray-50 transition">
            <PencilSquareIcon className="w-4 h-4" />
            EDIT
          </button>
        </div>
      </div>

      {/* Period Status */}
      {activePeriod && (
        <div className="bg-white border-2 border-neo-border rounded-xl p-5 card-hover">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDaysIcon className="w-4 h-4 text-neo-primary" />
            <span className="text-[11px] font-bold text-neo-text-secondary tracking-[0.08em] uppercase">Periode: {activePeriod.name}</span>
          </div>
          {tidakPulang ? (
            <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-center">
              <TruckIcon className="w-8 h-8 mx-auto text-gray-400 mb-1" />
              <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 border border-gray-300">TIDAK PULANG</span>
              <p className="text-sm text-gray-500 mt-2 font-medium">Santri tidak pulang — tidak perlu pembayaran</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 border-2 border-neo-border rounded-xl text-center">
                  <div className="text-[10px] font-bold text-gray-400 tracking-[0.06em] uppercase">Biaya{planMultiplier > 1 && <span className="text-neo-primary ml-0.5">×{planMultiplier}</span>}</div>
                  <div className="text-base font-black text-neo-text-primary mt-0.5">{formatRupiah(fee)}</div>
                  {planMultiplier > 1 && <div className="text-[9px] text-gray-400 mt-0.5">({formatRupiah(baseFee)} × {planMultiplier})</div>}
                </div>
                <div className="p-3 bg-green-50 border-2 border-green-200 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-green-600 tracking-[0.06em] uppercase">Dibayar</div>
                  <div className="text-base font-black text-neo-green mt-0.5">{formatRupiah(totalPaid)}</div>
                </div>
                <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-red-600 tracking-[0.06em] uppercase">Sisa</div>
                  <div className="text-base font-black text-neo-red mt-0.5">{formatRupiah(remaining)}</div>
                </div>
              </div>
              <div className="mt-3 text-center">
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold border-2 rounded-full ${statusStyle(status)}`}>
                  {status === 'LUNAS' ? <CheckBadgeIcon className="w-4 h-4" /> : <ExclamationCircleIcon className="w-4 h-4" />}
                  {status}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Homecoming Info */}
      {homecoming && (
        <div className="bg-white border-2 border-neo-border rounded-xl p-5 card-hover">
          <div className="flex items-center gap-2 mb-3">
            <TruckIcon className="w-4 h-4 text-neo-green" />
            <span className="text-[11px] font-bold text-neo-text-secondary tracking-[0.08em] uppercase">Rencana Pulang</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="font-semibold text-gray-500">Rencana:</div>
            <div className="font-bold text-neo-text-primary">{planLabel}</div>
            <div className="font-semibold text-gray-500">Berangkat:</div>
            <div className="font-bold text-neo-text-primary">{formatDateIndonesian(homecoming.departureDate)}</div>
            <div className="font-semibold text-gray-500">Batas Kembali:</div>
            <div className="font-bold text-neo-text-primary">{formatDateIndonesian(homecoming.mandatoryReturnDate)}</div>
            {homecoming.actualReturnDate && (
              <>
                <div className="font-semibold text-gray-500">Tgl Kembali:</div>
                <div className="font-bold text-neo-green">{formatDateIndonesian(homecoming.actualReturnDate)}</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Payments Section */}
            <div className="bg-white border-2 border-neo-border rounded-xl p-5 card-hover">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BanknotesIcon className="w-4 h-4 text-neo-green" />
                  <span className="text-[11px] font-bold text-neo-text-secondary tracking-[0.08em] uppercase">Riwayat Pembayaran</span>
                </div>
                {!tidakPulang && (
                  <>
                    <button onClick={handleExportPaymentsExcel} title="Export Excel"
                      className="btn-press inline-flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-neo-border text-sm font-bold text-neo-text-primary rounded-xl hover:bg-gray-50 transition">
                      <ArrowDownTrayIcon className="w-4 h-4 text-green-600" />
                    </button>
                    <button onClick={handleExportPaymentsPDF} title="Export PDF"
                      className="btn-press inline-flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-neo-border text-sm font-bold text-neo-text-primary rounded-xl hover:bg-gray-50 transition">
                      <DocumentArrowDownIcon className="w-4 h-4 text-red-600" />
                    </button>
                    <button onClick={() => setShowPayment(true)}
                      className="btn-press inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-neo-primary to-neo-primary-dark text-white text-xs font-bold rounded-xl border-2 border-neo-primary-dark hover:brightness-110 transition">
                      <PlusIcon className="w-3.5 h-3.5" />
                      TAMBAH
                    </button>
                  </>
                )}
              </div>

        {tidakPulang && <div className="text-sm text-gray-500 font-medium">Santri tidak pulang — tidak ada pembayaran</div>}

        {/* Add Payment Form */}
        {!tidakPulang && showPayment && (
          <form onSubmit={handleAddPayment} className="mb-4 p-4 bg-gray-50 border-2 border-neo-border rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neo-text-primary">Tambah Pembayaran</span>
              <button type="button" onClick={() => setShowPayment(false)} className="p-1 rounded hover:bg-gray-200 transition">
                <XMarkIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 tracking-[0.06em] uppercase">Jumlah</label>
                <RupiahInput value={payForm.amount} onChange={v => setPayForm({...payForm, amount: v})} required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 tracking-[0.06em] uppercase">Tanggal</label>
                <input type="date" value={payForm.date} onChange={e => setPayForm({...payForm, date: e.target.value})}
                  className="w-full px-2.5 py-2 border-2 border-neo-border rounded-lg text-sm font-bold focus:outline-none focus:border-neo-primary transition" required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 tracking-[0.06em] uppercase">Metode</label>
                <select value={payForm.method} onChange={e => setPayForm({...payForm, method: e.target.value})}
                  className="w-full px-2.5 py-2 border-2 border-neo-border rounded-lg text-sm font-bold focus:outline-none focus:border-neo-primary transition">
                  <option>TUNAI</option><option>TRANSFER</option><option>LAINNYA</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 tracking-[0.06em] uppercase">Catatan</label>
                <input value={payForm.notes} onChange={e => setPayForm({...payForm, notes: e.target.value})}
                  className="w-full px-2.5 py-2 border-2 border-neo-border rounded-lg text-sm font-bold focus:outline-none focus:border-neo-primary transition" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 tracking-[0.06em] uppercase">
                Bukti Transfer <span className="font-normal text-gray-400">(max 500KB, otomatis diperkecil)</span>
              </label>
              <input type="file" accept="image/*" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setPayForm({...payForm, receiptPath: await fileToBase64(f)});
              }} className="w-full text-sm mt-1" />
              {payForm.receiptPath && (
                <div className="mt-1 flex items-center gap-2">
                  <img src={payForm.receiptPath} className="h-10 w-10 object-cover border-2 border-neo-border rounded-lg" />
                  <button type="button" onClick={() => setPayForm({...payForm, receiptPath: ''})}
                    className="text-xs font-bold text-neo-red hover:underline">HAPUS</button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button type="submit"
                className="btn-press inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-neo-primary to-neo-primary-dark text-white text-xs font-bold rounded-xl border-2 border-neo-primary-dark hover:brightness-110 transition">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                SIMPAN
              </button>
              <button type="button" onClick={() => setShowPayment(false)}
                className="btn-press px-4 py-2 border-2 border-neo-border rounded-xl text-xs font-bold hover:bg-gray-50 transition">BATAL</button>
            </div>
          </form>
        )}

        {/* Payment list */}
        {payments.length === 0 && !tidakPulang ? (
          <div className="text-center py-6">
            <BanknotesIcon className="w-8 h-8 mx-auto text-gray-300 mb-1" />
            <div className="text-sm font-medium text-gray-400">Belum ada pembayaran</div>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 border-2 border-neo-border rounded-xl hover:bg-gray-50 transition card-hover">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-green-50">
                    <BanknotesIcon className="w-4 h-4 text-neo-green" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-neo-text-primary">{formatRupiah(p.amount)}</div>
                    <div className="text-[11px] font-medium text-gray-400">{formatDateIndonesian(p.date)} &bull; {p.method}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.receiptPath && (
                    <button onClick={() => setReceiptModal(p.receiptPath)}
                      className="btn-press inline-flex items-center gap-1 text-xs font-bold text-neo-primary px-2.5 py-1.5 border border-neo-primary/30 rounded-lg hover:bg-blue-50 transition">
                      <PhotoIcon className="w-3.5 h-3.5" />
                      BUKTI
                    </button>
                  )}
                  <button onClick={() => handleDeletePayment(p.id)}
                    className="btn-press inline-flex items-center gap-1 text-xs font-bold text-neo-red px-2.5 py-1.5 border border-neo-red/30 rounded-lg hover:bg-red-50 transition">
                    <TrashIcon className="w-3.5 h-3.5" />
                    HAPUS
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditing(false)}>
          <div className="bg-white border-2 border-neo-border rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <PencilSquareIcon className="w-5 h-5 text-neo-primary" />
                <h3 className="text-base font-bold text-neo-text-primary">Edit Santri</h3>
              </div>
              <button onClick={() => setEditing(false)} className="p-1 rounded-lg hover:bg-gray-100 transition">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-3.5">
              {[
                { label: 'Nama Lengkap', key: 'name' },
                { label: 'Kamar', key: 'room' },
                { label: 'No. HP Wali', key: 'guardianPhone' },
                { label: 'Alamat', key: 'address' },
                { label: 'Kontak Darurat', key: 'emergencyContact' },
                { label: 'Catatan', key: 'notes', textarea: true },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.06em] uppercase mb-1">{f.label}</label>
                  {f.textarea ? (
                    <textarea value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})}
                      className="w-full px-3 py-2 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary focus:ring-2 focus:ring-neo-primary/20 transition" rows={2} />
                  ) : (
                    <input value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})}
                      className="w-full px-3 py-2.5 border-2 border-neo-border rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary focus:ring-2 focus:ring-neo-primary/20 transition" />
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button type="submit"
                  className="btn-press flex-1 py-2.5 bg-gradient-to-r from-neo-primary to-neo-primary-dark text-white text-sm font-bold rounded-xl border-2 border-neo-primary-dark hover:brightness-110 transition">
                  Simpan
                </button>
                <button type="button" onClick={() => setEditing(false)}
                  className="btn-press px-5 py-2.5 border-2 border-neo-border rounded-xl text-sm font-bold text-neo-text-primary hover:bg-gray-50 transition">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReceiptModal(null)}>
          <div className="bg-white border-2 border-neo-border rounded-2xl p-4 max-w-lg w-full max-h-[80vh] overflow-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neo-text-secondary tracking-[0.06em] uppercase">Bukti Pembayaran</span>
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
