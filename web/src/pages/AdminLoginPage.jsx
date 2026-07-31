import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/auth';
import { LockClosedIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email dan password harus diisi'); return; }
    setLoading(true);
    try {
      const data = await login(email, password);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setAdmin(data.admin);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative geometric pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 border-2 border-white rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 border-2 border-white rounded-full" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 border-2 border-white rounded-full" />
      </div>
      {/* Gold accent line top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neo-gold to-transparent" />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="Logo" className="h-20 w-20 mx-auto mb-4 rounded-2xl object-cover shadow-2xl ring-4 ring-white/10" onError={(e) => { e.target.style.display = 'none' }} />
          <h1 className="text-2xl font-black text-white">Admin Login</h1>
          <p className="text-sm font-medium text-emerald-300/70 mt-1">Sistem Informasi Pondok Pesantren</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.1em] uppercase mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary focus:ring-2 focus:ring-neo-primary/20 transition bg-stone-50"
                placeholder="admin@ponpes.sch.id" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neo-text-secondary tracking-[0.1em] uppercase mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3.5 py-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-neo-primary focus:ring-2 focus:ring-neo-primary/20 transition bg-stone-50"
                placeholder="••••••••" />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600 text-center">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-press w-full py-3 bg-gradient-to-r from-neo-primary to-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-900/30 hover:shadow-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <LockClosedIcon className="w-4 h-4" />
                  Login
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-100 text-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-neo-primary hover:text-neo-primary-dark transition">
              <ArrowLeftIcon className="w-4 h-4" />
              Kembali ke halaman publik
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
