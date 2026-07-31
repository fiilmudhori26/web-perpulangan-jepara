import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import { getBrandConfig, saveBrandConfig } from '../api/config';
import { logout as apiLogout } from '../api/auth';
import { ArrowRightOnRectangleIcon, ShieldCheckIcon, InformationCircleIcon, PaintBrushIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { admin, setAdmin } = useAuth();
  const { brand, setBrand } = useBrand();
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (brand) setForm({
      name: brand.name || '',
      shortName: brand.shortName || '',
      tagline: brand.tagline || '',
      address: brand.address || '',
      phone: brand.phone || '',
      email: brand.email || '',
      website: brand.website || '',
    });
  }, [brand]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await saveBrandConfig(form);
      setBrand(updated);
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await apiLogout(); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAdmin(null);
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h2 className="text-lg font-black text-neo-text-primary tracking-tight">Pengaturan</h2>

      {/* Brand Config */}
      <div className="bg-white border-2 border-neo-border rounded-xl p-5 card-hover">
        <div className="flex items-center gap-2 mb-4">
          <PaintBrushIcon className="w-5 h-5 text-purple-500" />
          <h3 className="text-sm font-black text-neo-text-primary">Branding Pondok</h3>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-2 rounded-lg text-xs font-bold ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 tracking-[0.08em] uppercase block mb-1">Nama Pondok</label>
            <input type="text" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 text-sm font-semibold border-2 border-neo-border rounded-lg focus:border-neo-primary outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 tracking-[0.08em] uppercase block mb-1">Nama Singkat</label>
            <input type="text" value={form.shortName || ''} onChange={e => setForm({...form, shortName: e.target.value})}
              className="w-full px-3 py-2 text-sm font-semibold border-2 border-neo-border rounded-lg focus:border-neo-primary outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-gray-400 tracking-[0.08em] uppercase block mb-1">Tagline</label>
            <input type="text" value={form.tagline || ''} onChange={e => setForm({...form, tagline: e.target.value})}
              className="w-full px-3 py-2 text-sm font-semibold border-2 border-neo-border rounded-lg focus:border-neo-primary outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-gray-400 tracking-[0.08em] uppercase block mb-1">Alamat Pondok</label>
            <textarea value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} rows={2}
              className="w-full px-3 py-2 text-sm font-semibold border-2 border-neo-border rounded-lg focus:border-neo-primary outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 tracking-[0.08em] uppercase block mb-1">Telepon</label>
            <input type="text" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full px-3 py-2 text-sm font-semibold border-2 border-neo-border rounded-lg focus:border-neo-primary outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 tracking-[0.08em] uppercase block mb-1">Email</label>
            <input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full px-3 py-2 text-sm font-semibold border-2 border-neo-border rounded-lg focus:border-neo-primary outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-gray-400 tracking-[0.08em] uppercase block mb-1">Website</label>
            <input type="text" value={form.website || ''} onChange={e => setForm({...form, website: e.target.value})}
              className="w-full px-3 py-2 text-sm font-semibold border-2 border-neo-border rounded-lg focus:border-neo-primary outline-none" />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="btn-press px-6 py-2.5 bg-gradient-to-r from-neo-primary to-blue-700 text-white text-sm font-bold rounded-xl border-2 border-blue-800 hover:brightness-110 transition disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan Branding'}
          </button>
        </div>
      </div>

      {/* Admin Profile */}
      <div className="bg-white border-2 border-neo-border rounded-xl p-5 card-hover">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheckIcon className="w-5 h-5 text-neo-primary" />
          <h3 className="text-sm font-black text-neo-text-primary">Profil Admin</h3>
        </div>
        {admin && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-bold text-gray-400 tracking-[0.08em] uppercase">Nama</span>
              <p className="text-sm font-bold text-neo-text-primary mt-0.5">{admin.name || '-'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 tracking-[0.08em] uppercase">Email</span>
              <p className="text-sm font-bold text-neo-text-primary mt-0.5">{admin.email}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 tracking-[0.08em] uppercase">Role</span>
              <p className="text-sm font-bold text-neo-text-primary uppercase mt-0.5">{admin.role || 'admin'}</p>
            </div>
          </div>
        )}
      </div>

      {/* System Info */}
      <div className="bg-white border-2 border-neo-border rounded-xl p-5 card-hover">
        <div className="flex items-center gap-2 mb-4">
          <InformationCircleIcon className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-black text-neo-text-primary">Informasi Sistem</h3>
        </div>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-500">Aplikasi</span>
            <span className="font-bold text-neo-text-primary">SantriFlow</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-500">Versi</span>
            <span className="font-bold text-neo-text-primary">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-500">Platform</span>
            <span className="font-bold text-neo-text-primary">Web</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white border-2 border-neo-border rounded-xl p-5 card-hover">
        <h3 className="text-sm font-black text-neo-text-primary mb-4">Aksi</h3>
        <button onClick={handleLogout}
          className="btn-press flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-bold rounded-xl border-2 border-red-800 hover:brightness-110 transition">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
